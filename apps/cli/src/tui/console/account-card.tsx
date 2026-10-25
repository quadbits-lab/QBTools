/**
 * Account card — the local-first story. Everything works signed out; a server
 * is optional and only unlocks sync, AI helpers and media storage.
 */

import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { loadAuth, type StoredAuth } from "../../services/auth-store";
import { loadConfig, serverUrl } from "../../services/config";
import { accents, theme } from "../theme";
import { CARD_KEY_PRIORITY, useKeyHandler } from "../ui";

export interface AccountCardProps {
	width: number;
	onClose(): void;
}

const UNLOCKS: Array<[string, string]> = [
	["Favorites & recents sync", "your tool list follows you"],
	["AI helpers", "grammar + paraphrase on your server"],
	["Media storage", "upload and copy files back down"],
];

export function AccountCard(props: AccountCardProps) {
	const [auth, setAuth] = useState<StoredAuth | null>(null);
	const [base, setBase] = useState("");

	useEffect(() => {
		void loadAuth().then(setAuth);
		void loadConfig().then((config) => setBase(serverUrl(config)));
	}, []);

	useKeyHandler(
		(_input, key) => {
			if (key.escape) {
				props.onClose();
				return true;
			}
			return false;
		},
		{ priority: CARD_KEY_PRIORITY },
	);

	const first = Math.max(24, Math.floor((props.width - 8) * 0.3));
	const second = Math.max(28, Math.floor((props.width - 8) * 0.4));

	return (
		<Box flexDirection="row" height={6} overflow="hidden" flexShrink={0}>
			<Box flexDirection="column" width={first} paddingRight={2} flexShrink={0}>
				<Text color={theme.fg} bold>
					Account
				</Text>
				{auth ? (
					<Text color={accents.emerald}>
						{`● ${auth.user?.email ?? auth.user?.name ?? "signed in"}`}
					</Text>
				) : (
					<Text>
						<Text color={accents.emerald}>●</Text>
						<Text color={theme.textDim}> local mode — every tool runs offline</Text>
					</Text>
				)}
				<Text color={theme.textSubtle}>{`Server: ${base || "(not set — optional)"}`}</Text>
			</Box>
			<Box flexDirection="column" width={second} paddingRight={2} flexShrink={0}>
				<Text color={theme.textSubtle}>WHAT AN ACCOUNT UNLOCKS</Text>
				<Text>
					{UNLOCKS.map(([title, detail], index) => (
						<Text key={title}>
							{index > 0 ? "\n" : ""}
							<Text color={theme.textDim}>{`· ${title}`}</Text>
							<Text color={theme.textSubtle}>{` — ${detail}`}</Text>
						</Text>
					))}
				</Text>
			</Box>
			<Box
				flexDirection="column"
				width={Math.max(24, props.width - 8 - first - second)}
				flexShrink={0}
			>
				<Text color={theme.textSubtle}>CONNECT (OPTIONAL)</Text>
				<Text color={theme.textDim}>
					{"dashboard → CLI API keys → create a key"}
					{"\nthen run qbtools login --api-key qbk_…"}
				</Text>
			</Box>
		</Box>
	);
}
