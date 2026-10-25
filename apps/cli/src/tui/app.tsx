/**
 * TUI shell: header + sidebar + active screen + footer, with global keys
 * (Esc back, / search, ? help) and a first-run wizard. Ctrl+C never kills the
 * app directly — it quits idle and cancels a running job instead; exit always
 * goes through renderer.destroy().
 */

import { useTerminalDimensions } from "@opentui/react";
import { categories } from "@qbtools/registry";
import { useEffect, useState } from "react";
import { loadConfig } from "../services/config";
import { checkForUpdate, updateHint } from "../services/update-check";
import { Footer, Header, inputFocus, Sidebar, type SidebarItem } from "./components";
import { setShellHandler } from "./keys";
import { AccountScreen } from "./screens/account";
import { categoryListMeta, categoryName, SearchScreen, ToolListScreen } from "./screens/browse";
import { CleanupScreen } from "./screens/cleanup";
import { DashboardScreen } from "./screens/dashboard";
import { SettingsScreen } from "./screens/settings";
import { ToolScreen } from "./screens/tool";
import { accents, theme } from "./theme";

type Screen =
	| { kind: "wizard" }
	| { kind: "dashboard" }
	| { kind: "search" }
	| { kind: "category"; id: string }
	| { kind: "tool"; slug: string }
	| { kind: "settings" }
	| { kind: "account" }
	| { kind: "system" }
	| { kind: "help" };

const HELP_LINES = [
	"QBTools — keys",
	"",
	"Tab / Shift+Tab   move between fields",
	"Enter             select / run",
	"Ctrl+R            run the open tool",
	"Esc               back",
	"/                 jump to search",
	"?                 toggle this help",
	"Ctrl+C            cancel run / quit",
];

export function App() {
	const { width, height } = useTerminalDimensions();
	const contentWidth = Math.max(20, width - 24); // sidebar is 24 columns
	const [screen, setScreen] = useState<Screen>({ kind: "wizard" });
	const [sidebarIndex, setSidebarIndex] = useState(0);
	const [userChip, setUserChip] = useState<string | undefined>(undefined);
	const [hint, setHint] = useState<string | undefined>(undefined);

	useEffect(() => {
		void loadConfig().then((config) => {
			setScreen(config.onboarded ? { kind: "dashboard" } : { kind: "wizard" });
		});
		void checkForUpdate().then((status) => setHint(updateHint(status) ?? undefined));
	}, []);

	const sidebarItems: SidebarItem[] = [
		{ name: "Dashboard", value: "dashboard" },
		{ name: "Search", value: "search" },
		...categories.map((category) => ({
			name: category.name,
			value: `category:${category.id}`,
		})),
		{ name: "System cleanup", value: "system" },
		{ name: "Account", value: "account" },
		{ name: "Settings", value: "settings" },
	];

	const navScreens = new Set<
		"wizard" | "dashboard" | "search" | "category" | "settings" | "account"
	>(["wizard", "dashboard", "search", "category", "settings", "account"]);
	const screenIsNav = navScreens.has(screen.kind as never);

	function navigateByValue(value: string): void {
		if (value === "dashboard") setScreen({ kind: "dashboard" });
		else if (value === "search") setScreen({ kind: "search" });
		else if (value === "account") setScreen({ kind: "account" });
		else if (value === "settings") setScreen({ kind: "settings" });
		else if (value === "system") setScreen({ kind: "system" });
		else if (value.startsWith("category:")) {
			setScreen({ kind: "category", id: value.slice("category:".length) });
		}
	}

	useEffect(() => {
		// Shell tier: globals only; everything else falls through to the screen.
		setShellHandler((key) => {
			if (key.name === "escape" && screen.kind !== "wizard" && screen.kind !== "dashboard") {
				setScreen({ kind: "dashboard" });
				return true;
			}
			if (key.name === "?" && inputFocus.tag === "none") {
				setScreen((current) =>
					current.kind === "help" ? { kind: "dashboard" } : { kind: "help" },
				);
				return true;
			}
			if (key.name === "/" && inputFocus.tag === "none") {
				setScreen({ kind: "search" });
				return true;
			}
			// Focused OpenTUI widgets (selects, inputs) handle their own keys.
			return false;
		});
		return () => setShellHandler(null);
	}, [screen.kind]);

	function sidebarIndexFor(current: Screen): number {
		switch (current.kind) {
			case "search":
				return 1;
			case "category":
				return 2 + categories.findIndex((category) => category.id === current.id);
			case "system":
				return sidebarItems.length - 3;
			case "account":
				return sidebarItems.length - 2;
			case "settings":
				return sidebarItems.length - 1;
			default:
				return 0;
		}
	}

	const footerHint =
		screen.kind === "tool"
			? "Tab fields · Enter/Ctrl+R run · Esc back · ? help"
			: "Enter open · / search · ? help · Esc back";

	return (
		<box flexDirection="column" width="100%" height="100%" backgroundColor={theme.bg}>
			<Header userChip={userChip} updateHint={hint} />
			<box flexDirection="row" flexGrow={1}>
				<Sidebar
					items={sidebarItems}
					selectedIndex={Math.min(sidebarIndex, sidebarItems.length - 1)}
					focused={screenIsNav}
					onSelect={(value: string) => navigateByValue(value)}
					onChange={(index: number) => setSidebarIndex(index)}
				/>
				<box flexGrow={1} flexDirection="column">
					{screen.kind === "wizard" ? (
						<SettingsScreen
							width={contentWidth}
							wizard
							onDone={() => setScreen({ kind: "dashboard" })}
						/>
					) : null}
					{screen.kind === "dashboard" ? (
						<DashboardScreen
							width={contentWidth}
							onOpenTool={(slug) => setScreen({ kind: "tool", slug })}
						/>
					) : null}
					{screen.kind === "search" ? (
						<SearchScreen
							width={contentWidth}
							onOpenTool={(slug) => setScreen({ kind: "tool", slug })}
						/>
					) : null}
					{screen.kind === "category" ? (
						<ToolListScreen
							title={categoryName(screen.id)}
							tools={categoryListMeta(screen.id)}
							onOpenTool={(slug) => setScreen({ kind: "tool", slug })}
						/>
					) : null}
					{screen.kind === "tool" ? <ToolScreen slug={screen.slug} width={contentWidth} /> : null}
					{screen.kind === "settings" ? (
						<SettingsScreen width={contentWidth} onDone={() => setScreen({ kind: "dashboard" })} />
					) : null}
					{screen.kind === "account" ? <AccountScreen /> : null}
					{screen.kind === "system" ? <CleanupScreen /> : null}
					{screen.kind === "help" ? <HelpOverlay /> : null}
				</box>
			</box>
			<Footer hint={footerHint} />
		</box>
	);
}

function HelpOverlay() {
	return (
		<box
			position="absolute"
			left="15%"
			top="15%"
			width="70%"
			flexDirection="column"
			border
			borderStyle="double"
			borderColor={accentHex()}
			backgroundColor={theme.card}
			padding={2}
			gap={0}
			zIndex={10}
		>
			{HELP_LINES.map((line, index) => (
				<text key={index} fg={index === 0 ? theme.fg : theme.textDim}>
					{line}
				</text>
			))}
			<text fg={theme.textSubtle}>Press ? or Esc to close.</text>
		</box>
	);
}

function accentHex(): string {
	return accents.indigo;
}
