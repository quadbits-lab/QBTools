/**
 * Settings card — server URL, output directory and the update check, rendered
 * in the inspector. Saving writes the active profile to the config file.
 */

import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import {
	activeProfile,
	type CliConfig,
	effectiveProfileName,
	loadConfig,
	saveConfig,
} from "../../services/config";
import { accents, theme } from "../theme";
import { CARD_KEY_PRIORITY, Select, TextInput, useKeyHandler } from "../ui";
import { type ConsoleEvent, makeEvent } from "./events";

export interface SettingsCardProps {
	width: number;
	onEvent(event: ConsoleEvent): void;
	onClose(): void;
}

export function SettingsCard(props: SettingsCardProps) {
	const [config, setConfig] = useState<CliConfig | null>(null);
	const [serverUrl, setServerUrl] = useState("");
	const [outputDir, setOutputDir] = useState("");
	const [updateCheck, setUpdateCheck] = useState(true);
	const [focusIndex, setFocusIndex] = useState(0);
	const saveRow = 3;

	useEffect(() => {
		void loadConfig().then((loaded) => {
			setConfig(loaded);
			const profile = activeProfile(loaded);
			setServerUrl(profile.serverUrl);
			setOutputDir(profile.outputDir);
			setUpdateCheck(loaded.updateCheck);
		});
	}, []);

	async function save(): Promise<void> {
		if (!config) return;
		const name = effectiveProfileName(config);
		const next: CliConfig = {
			...config,
			updateCheck,
			onboarded: true,
			profiles: {
				...config.profiles,
				[name]: {
					...config.profiles[name],
					serverUrl: serverUrl.trim().replace(/\/+$/, "") || "http://localhost:8310",
					outputDir: outputDir.trim() || "./qbtools-output",
				},
			},
		};
		await saveConfig(next);
		setConfig(next);
		props.onEvent(makeEvent("DONE", "settings saved", { level: "ok" }));
		props.onClose();
	}

	useKeyHandler(
		(_input, key) => {
			if (key.tab) {
				setFocusIndex((index) => {
					const next = index + (key.shift ? -1 : 1);
					if (next < 0) return saveRow;
					if (next > saveRow) return 0;
					return next;
				});
				return true;
			}
			if (key.return && focusIndex === saveRow) {
				void save();
				return true;
			}
			if (key.escape) {
				props.onClose();
				return true;
			}
			return false;
		},
		{ priority: CARD_KEY_PRIORITY },
	);

	if (!config) {
		return <Text color={theme.textSubtle}>Loading settings…</Text>;
	}

	const half = Math.max(24, Math.floor((props.width - 4) / 2));

	return (
		<Box flexDirection="column" height={7} overflow="hidden" flexShrink={0}>
			<Box flexDirection="row" flexShrink={0}>
				<Box flexDirection="column" width={half} paddingRight={2} flexShrink={0}>
					<Text color={focusIndex === 0 ? theme.fg : theme.textDim}>
						{`${focusIndex === 0 ? "▸" : " "} Server URL (optional)`}
					</Text>
					<TextInput
						value={serverUrl}
						onChange={setServerUrl}
						placeholder="http://localhost:8310"
						focused={focusIndex === 0}
						width={half - 4}
					/>
				</Box>
				<Box flexDirection="column" width={half} flexShrink={0}>
					<Text color={focusIndex === 1 ? theme.fg : theme.textDim}>
						{`${focusIndex === 1 ? "▸" : " "} Output directory`}
					</Text>
					<TextInput
						value={outputDir}
						onChange={setOutputDir}
						placeholder="./qbtools-output"
						focused={focusIndex === 1}
						width={half - 4}
					/>
				</Box>
			</Box>
			<Box flexDirection="row" marginTop={1} flexShrink={0}>
				<Box flexDirection="column" width={half} paddingRight={2} flexShrink={0}>
					<Text color={focusIndex === 2 ? theme.fg : theme.textDim}>
						{`${focusIndex === 2 ? "▸" : " "} Check npm for updates`}
					</Text>
					<Select
						focused={focusIndex === 2}
						options={[
							{ label: "On", value: "true" },
							{ label: "Off", value: "false" },
						]}
						value={updateCheck ? "true" : "false"}
						onChange={(value) => setUpdateCheck(value === "true")}
						visibleRows={2}
					/>
				</Box>
				<Box flexDirection="column" width={half} flexShrink={0}>
					<Text color={focusIndex === saveRow ? accents.emerald : theme.textSubtle}>
						{focusIndex === saveRow ? "▸ Save (Enter)" : "  Save (Tab, then Enter)"}
					</Text>
					<Text color={theme.textSubtle}>
						{`Profile: ${effectiveProfileName(config)} · writes ~/.config/qbtools/config.json`}
					</Text>
				</Box>
			</Box>
		</Box>
	);
}
