/**
 * The console — the interactive shell.
 *
 * Layout (top to bottom): the hero header, the command bar, the tool browser
 * beside the inspector, the event log, and the status bar. The prompt is the
 * only input: typing filters the registry, Enter opens a tool or runs a
 * fully typed command.
 */

import { homedir, hostname, userInfo } from "node:os";
import {
	buildSearchIndex,
	categories,
	type ToolDef,
	tools,
	toolsInCategory,
} from "@qbtools/registry";
import { Box, useApp } from "ink";
import { useEffect, useMemo, useState } from "react";
import { renderOutput } from "../headless/cmd/run";
import { AVAILABILITY_HINTS, AVAILABILITY_LABELS, availabilityFor, RUNNERS } from "../runner/map";
import { nearestNames } from "../services/file-suggest";
import { checkForUpdate, updateHint } from "../services/update-check";
import { CLI_VERSION } from "../version";
import { cancelRunning } from "./cancel";
import { AccountCard } from "./console/account-card";
import { buildBoard, CARD_HEIGHT, type Direction } from "./console/board";
import { categoryCode } from "./console/categories";
import { CleanupCard } from "./console/cleanup-card";
import { CommandBar } from "./console/command-bar";
import { EventLog } from "./console/event-log";
import { type ConsoleEvent, makeEvent } from "./console/events";
import { Header } from "./console/header";
import { fieldsWidth, InspectorStrip, type StripMode } from "./console/inspector";
import { runDirectCommand } from "./console/run-command";
import { SettingsCard } from "./console/settings-card";
import { StatusBar } from "./console/status-bar";
import { ToolBoard } from "./console/tool-board";
import { ToolForm } from "./console/tool-form";
import { SCREEN_KEY_PRIORITY, useKeyHandler, useTerminalSize } from "./ui";
import { Panel } from "./ui/panel";

type Card = "none" | "tool" | "cleanup" | "settings" | "account";

const searchIndex = buildSearchIndex(tools);

function homeCwd(): string {
	const home = homedir();
	const cwd = process.cwd();
	return cwd.startsWith(home) ? `~${cwd.slice(home.length)}` : cwd;
}

/** Shell-prompt parts: `user@host` and the home-abbreviated cwd. */
interface PromptParts {
	userAt: string;
	dir: string;
}

function promptParts(): PromptParts {
	let user = "user";
	try {
		user = userInfo().username;
	} catch {
		/* keep the default */
	}
	let host = "local";
	try {
		host = hostname().split(".")[0] ?? "local";
	} catch {
		/* keep the default */
	}
	return { userAt: `${user}@${host}`, dir: homeCwd() };
}

/** Sticky strip height per inspected mode. */
const STRIP_ROWS: Record<StripMode, number> = {
	details: 7,
	tool: 14,
	cleanup: 14,
	settings: 9,
	account: 8,
};

function stripMode(card: Card): StripMode {
	if (card === "none") return "details";
	return card;
}

export function Console() {
	const { exit } = useApp();
	const { columns, rows } = useTerminalSize();
	const [query, setQuery] = useState("");
	const [selectedSlug, setSelectedSlug] = useState<string | undefined>(undefined);
	const [boardOffset, setBoardOffset] = useState(0);
	const [card, setCard] = useState<Card>("none");
	const [openSlug, setOpenSlug] = useState<string | undefined>(undefined);
	const [events, setEvents] = useState<ConsoleEvent[]>([]);
	const [logOffset, setLogOffset] = useState(0);
	const [busy, setBusy] = useState(false);

	const prompt = useMemo(() => promptParts(), []);
	const cwd = useMemo(() => homeCwd(), []);

	// Layout: the board is full width; the inspector is a sticky strip below it.
	// The budget always fits: when space is tight the log shrinks first, then
	// the strip, and the board keeps at least four rows.
	// Luxury chrome — the padded hero and the framed prompt — needs spare rows:
	// at 30 rows the board cannot give up any (the tests' frame), so the tiers
	// keep the compact frame below 34 rows and go plush from there.
	const roomy = rows >= 34;
	const headerRows = columns >= 92 ? (roomy ? 9 : 7) : roomy ? 12 : 10;
	const promptRows = roomy ? 3 : 1;
	let logRows = card === "none" ? Math.max(3, Math.min(6, Math.floor(rows * 0.18))) : 3;
	// Short terminals give the board the space: the log is the first to yield.
	if (rows < 40) logRows = Math.min(logRows, 3);
	let stripRows = Math.max(6, Math.min(STRIP_ROWS[stripMode(card)], Math.floor(rows * 0.42)));
	const fixedRows = headerRows + promptRows + 1; // header + prompt + status bar
	let boardRows = rows - fixedRows - stripRows - (logRows + 2);
	if (boardRows < 4) {
		const cut = Math.min(4 - boardRows, Math.max(0, logRows - 2));
		logRows -= cut;
		boardRows += cut;
	}
	if (boardRows < 4) {
		const cut = Math.min(4 - boardRows, Math.max(0, stripRows - 4));
		stripRows -= cut;
		boardRows += cut;
	}
	// Five-row cards: keep the panel fold from slicing a card row — browse
	// mode fits a header plus two full card rows, open-card mode a header
	// plus the selected row. The log yields first (floor 3), then the strip
	// (floor 4), mirroring the tiers above.
	const minBoardRows = 4 + (card === "none" ? 2 : 1) * CARD_HEIGHT;
	if (boardRows < minBoardRows) {
		const cut = Math.min(minBoardRows - boardRows, Math.max(0, logRows - 3));
		logRows -= cut;
		boardRows += cut;
	}
	if (boardRows < minBoardRows) {
		const cut = Math.min(minBoardRows - boardRows, Math.max(0, stripRows - 4));
		stripRows -= cut;
		boardRows += cut;
	}
	boardRows = Math.max(2, boardRows);
	// Rows for cards: the panel's content minus the pinned footer row.
	const boardViewport = Math.max(2, boardRows - 3);
	const boardWidth = columns;
	const boardInner = boardWidth - 4;
	const cardCols = Math.max(1, Math.floor((boardInner + 1) / 23));
	const cardWidth = Math.max(20, Math.floor((boardInner - (cardCols - 1)) / cardCols));

	const items = useMemo(() => {
		const raw = query.trim();
		let category: string | undefined;
		let text = raw;
		const colon = raw.indexOf(":");
		if (colon > 0) {
			const code = raw.slice(0, colon).toLowerCase();
			const match = categories.find(
				(candidate) => candidate.id === code || categoryCode(candidate.id) === code,
			);
			if (match) {
				category = match.id;
				text = raw.slice(colon + 1);
			}
		}
		if (!text) return category ? toolsInCategory(category as never) : tools;
		return searchIndex
			.search(text, 50)
			.filter((result) => result.kind === "tool")
			.filter((result) => !category || result.tool.category === category)
			.map((result) => result.tool);
	}, [query]);

	const board = useMemo(() => buildBoard(items, cardCols), [items, cardCols]);
	const selectedTool: ToolDef | undefined =
		(selectedSlug ? items.find((tool) => tool.slug === selectedSlug) : undefined) ?? items[0];

	// Keep the selection inside the filtered set.
	useEffect(() => {
		if (items.length === 0) {
			if (selectedSlug !== undefined) setSelectedSlug(undefined);
			return;
		}
		if (!selectedSlug || !items.some((tool) => tool.slug === selectedSlug)) {
			setSelectedSlug(items[0]?.slug);
		}
	}, [items, selectedSlug]);

	// Keep the selected card inside the viewport.
	useEffect(() => {
		if (!selectedSlug) return;
		const position = board.find(selectedSlug);
		if (!position) return;
		setBoardOffset((offset) => {
			if (position.y < offset) return board.snapOffset(position.y);
			if (position.y + CARD_HEIGHT > offset + boardViewport) {
				return board.snapOffset(position.y + CARD_HEIGHT - boardViewport);
			}
			return offset;
		});
	}, [board, selectedSlug, boardViewport]);

	function append(event: ConsoleEvent): void {
		setEvents((previous) => [...previous, event]);
		setLogOffset(0);
	}

	function moveSelection(direction: Direction): void {
		if (!selectedTool) return;
		const next = board.move(selectedTool.slug, direction);
		if (next) setSelectedSlug(next.slug);
	}

	function openTool(slug: string): void {
		const tool = tools.find((candidate) => candidate.slug === slug);
		if (!tool) return;
		const availability = availabilityFor(slug);
		if (availability === "web" || !RUNNERS.has(slug)) {
			append(
				makeEvent(
					"ERR",
					`${toolKey(tool)} runs in the browser — open it with: qbtools open ${slug}`,
					{
						level: "warn",
					},
				),
			);
			return;
		}
		setOpenSlug(slug);
		setCard("tool");
		append(makeEvent("OPEN", `${toolKey(tool)} — ${RUNNERS.get(slug)?.fields.length ?? 0} fields`));
	}

	function completeSelection(): void {
		if (!selectedTool) return;
		setQuery(`${categoryCode(selectedTool.category)}:${selectedTool.slug} `);
	}

	function submit(): void {
		const raw = query.trim();
		if (raw.startsWith("/")) {
			runCommand(raw.slice(1));
			return;
		}
		if (!raw) {
			// Nothing typed: open the card the cursor is on.
			if (selectedTool) openTool(selectedTool.slug);
			return;
		}
		const parts = raw.split(/\s+/);
		const first = parts[0] ?? "";
		const slug = resolveSlug(first);
		if (slug) {
			if (parts.length > 1) {
				void runDirect(slug, parts.slice(1));
				return;
			}
			openTool(slug);
			return;
		}
		if (selectedTool) {
			openTool(selectedTool.slug);
			return;
		}
		const hint = nearestNames(
			first,
			tools.map((tool) => tool.slug),
		);
		append(
			makeEvent(
				"ERR",
				hint.length
					? `Unknown command: ${first} — did you mean: ${hint.join(", ")}?`
					: `Unknown command: ${first}`,
				{ level: "error" },
			),
		);
	}

	function runCommand(name: string): void {
		const [command] = name.split(/\s+/);
		switch (command) {
			case "help":
				append(makeEvent("HELP", HELP_TEXT, { detail: HELP_LINES }));
				break;
			case "clear":
				setEvents([]);
				setLogOffset(0);
				break;
			case "settings":
				setCard("settings");
				append(makeEvent("OPEN", "settings"));
				break;
			case "account":
				setCard("account");
				append(makeEvent("OPEN", "account"));
				break;
			case "cleanup":
				setCard("cleanup");
				append(makeEvent("OPEN", "cleanup"));
				break;
			case "update":
				append(makeEvent("UPDATE", "checking the npm registry…"));
				void checkForUpdate().then((status) => {
					append(
						makeEvent(
							"UPDATE",
							updateHint(status) ?? (status ? "you are up to date" : "registry unreachable"),
							{ level: status?.updateAvailable ? "warn" : "info" },
						),
					);
				});
				break;
			case "quit":
				exit();
				break;
			default:
				append(makeEvent("ERR", `Unknown command: /${command}`, { level: "error" }));
				break;
		}
	}

	async function runDirect(slug: string, argv: string[]): Promise<void> {
		const tool = tools.find((candidate) => candidate.slug === slug);
		append(makeEvent("RUN", `${tool ? toolKey(tool) : slug} — ${argv.join(" ")}`));
		setBusy(true);
		try {
			const result = await runDirectCommand(slug, argv, {
				onProgress: (label, fraction) => {
					const percent = fraction === null ? "" : ` ${Math.round(fraction * 100)}%`;
					append(makeEvent("RUN", `${label}${percent}`));
				},
			});
			append(
				makeEvent("DONE", result.summary, {
					level: "ok",
					detail: result.outputs
						.map((output) => renderOutput(output))
						.filter((text) => text.trim().length > 0),
				}),
			);
		} catch (error) {
			append(
				makeEvent("ERR", error instanceof Error ? error.message : String(error), {
					level: "error",
				}),
			);
		} finally {
			setBusy(false);
		}
	}

	useKeyHandler(
		(input, key) => {
			if (key.ctrl) {
				if (input === "c") {
					if (!cancelRunning()) exit();
					return true;
				}
				if (input === "f") {
					setCard("none");
					setOpenSlug(undefined);
					return true;
				}
				if (input === "k") {
					setQuery("");
					return true;
				}
				if (input === "l") {
					setEvents([]);
					setLogOffset(0);
					return true;
				}
				return false;
			}
			if (card !== "none") return false; // the card owns the keyboard
			if (key.escape) {
				if (query) {
					setQuery("");
					return true;
				}
				return false;
			}
			if (key.tab) {
				completeSelection();
				return true;
			}
			if (key.return) {
				submit();
				return true;
			}
			if (key.upArrow) {
				moveSelection("up");
				return true;
			}
			if (key.downArrow) {
				moveSelection("down");
				return true;
			}
			if (key.leftArrow) {
				moveSelection("left");
				return true;
			}
			if (key.rightArrow) {
				moveSelection("right");
				return true;
			}
			return false;
		},
		{ priority: SCREEN_KEY_PRIORITY },
	);

	// Boot events — the console narrates itself like the reference panel.
	// biome-ignore lint/correctness/useExhaustiveDependencies: the boot log runs once
	useEffect(() => {
		append(
			makeEvent(
				"SYS_BOOT",
				`qb-core local runtime initialised — ${tools.length} module manifests loaded.`,
			),
		);
		append(makeEvent("NET_POLICIES", "window.fetch unused. Zero server roundtrips required."));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const availability = selectedTool ? availabilityFor(selectedTool.slug) : undefined;
	const runner = selectedTool ? RUNNERS.get(selectedTool.slug) : undefined;
	const flags =
		runner?.fields.map((field) => ({
			name: field.name,
			placeholder: flagPlaceholder(field.kind),
		})) ?? [];

	return (
		<Box flexDirection="column" width={columns} height={rows}>
			<Header
				width={columns}
				height={headerRows}
				version={CLI_VERSION}
				platform={`bun · ${process.platform}-${process.arch}`}
				toolCount={tools.length}
				status={busy ? "RUNNING" : "LOCAL"}
				cwd={cwd}
			/>
			<CommandBar
				width={columns}
				boxed={roomy}
				userAt={prompt.userAt}
				dir={prompt.dir}
				program="qbtools"
				value={query}
				onChange={setQuery}
				focused={card === "none"}
				hints={[
					{ keys: "<Enter>", label: "Run" },
					{ keys: "<Tab>", label: "Next" },
					{ keys: "<C-?>", label: "Help" },
				]}
			/>
			<PanelFrame
				label="TELESCOPE: TOOLS"
				right={`${items.length} TOOLS`}
				width={boardWidth}
				height={boardRows}
			>
				<ToolBoard
					width={boardWidth}
					height={boardViewport}
					board={board}
					cardWidth={cardWidth}
					selectedSlug={selectedTool?.slug}
					offset={boardOffset}
					shown={items.length}
					total={tools.length}
					query={query}
				/>
			</PanelFrame>
			<InspectorStrip
				width={columns}
				height={stripRows}
				mode={stripMode(card)}
				tool={selectedTool}
				availability={
					availability
						? {
								label: AVAILABILITY_LABELS[availability],
								hint: AVAILABILITY_HINTS[availability],
							}
						: undefined
				}
				flags={flags}
				body={
					card === "tool" && openSlug ? (
						<ToolForm
							slug={openSlug}
							width={fieldsWidth(columns)}
							height={stripRows - 2}
							onComplete={(result) => {
								append(
									makeEvent("DONE", result.summary, {
										level: "ok",
										detail: result.outputs
											.map((output) => renderOutput(output))
											.filter((text) => text.trim().length > 0),
									}),
								);
								setCard("none");
								setOpenSlug(undefined);
							}}
							onClose={() => {
								setCard("none");
								setOpenSlug(undefined);
							}}
						/>
					) : card === "cleanup" ? (
						<CleanupCard
							width={columns - 4}
							onClose={() => setCard("none")}
							onEvent={(event) => append(event)}
						/>
					) : card === "settings" ? (
						<SettingsCard
							width={columns - 4}
							onClose={() => setCard("none")}
							onEvent={(event) => append(event)}
						/>
					) : card === "account" ? (
						<AccountCard width={columns - 4} onClose={() => setCard("none")} />
					) : null
				}
			/>
			<PanelFrame label="SYS_STREAM: RING_BUFFER" width={columns} height={logRows + 2}>
				<EventLog width={columns} height={logRows} events={events} offset={logOffset} />
			</PanelFrame>
			<StatusBar
				width={columns}
				mode={busy ? "RUNNING" : card === "none" ? "NORMAL" : "INPUT"}
				hints={[
					{ keys: "<C-f>", label: "Focus" },
					{ keys: "<C-k>", label: "Clear" },
					{ keys: "<C-l>", label: "Log" },
				]}
				right="utf-8(Unix) · tools.quadbits.app"
			/>
		</Box>
	);
}

function PanelFrame(props: {
	label: string;
	right?: string;
	width: number;
	height: number;
	accent?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Panel
			label={props.label}
			right={props.right}
			width={props.width}
			accent={props.accent}
			height={props.height}
		>
			{props.children}
		</Panel>
	);
}

function toolKey(tool: ToolDef): string {
	return `${categoryCode(tool.category)}:${tool.slug}`;
}

function resolveSlug(token: string): string | undefined {
	const direct = tools.find((tool) => tool.slug === token);
	if (direct) return direct.slug;
	const colon = token.indexOf(":");
	if (colon > 0) {
		const code = token.slice(0, colon).toLowerCase();
		const slug = token.slice(colon + 1);
		const match = tools.find((tool) => tool.slug === slug && categoryCode(tool.category) === code);
		if (match) return match.slug;
	}
	return undefined;
}

function flagPlaceholder(kind: string): string {
	switch (kind) {
		case "file":
		case "files":
			return "path";
		case "number":
			return "n";
		case "select":
			return "value";
		case "boolean":
			return "on|off";
		default:
			return "text";
	}
}

const HELP_TEXT = "key reference";
const HELP_LINES = [
	"←→ across cards · ↑↓ between rows · Tab complete · Enter open/run · Esc back",
	"Ctrl+R run · Ctrl+F focus · Ctrl+K clear input · Ctrl+L clear log",
	"Ctrl+C cancel/quit · /help /clear /settings /account /cleanup /update /quit",
];
