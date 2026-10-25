/**
 * Account screen: shows sign-in state from the credential store, the
 * configured server, and the sync story. Login itself is headless
 * (`qbtools login --api-key …`) because keys are created in the web dashboard.
 */

import { useEffect, useState } from "react";
import { loadAuth, type StoredAuth } from "../../services/auth-store";
import { loadConfig, serverUrl } from "../../services/config";
import { accents, theme } from "../theme";

export function AccountScreen() {
	const [auth, setAuth] = useState<StoredAuth | null>(null);
	const [base, setBase] = useState("");
	useEffect(() => {
		void loadAuth().then(setAuth);
		void loadConfig().then((config) => setBase(serverUrl(config)));
	}, []);

	const signedIn = auth !== null;
	const statusColor = signedIn ? accents.emerald : theme.textSubtle;
	const statusText = signedIn
		? `● Signed in as ${auth.user?.email ?? auth.user?.name ?? "user"} (${auth.kind === "token" ? "API key" : "session"})`
		: "○ Signed out";

	return (
		<box
			flexDirection="column"
			flexGrow={1}
			paddingTop={1}
			paddingLeft={2}
			paddingRight={2}
			gap={1}
		>
			<text fg={theme.fg}>
				<strong>Account</strong>
			</text>
			<text fg={statusColor}>{statusText}</text>
			<text fg={theme.textDim}>Server: {base || "(not set)"}</text>
			<box flexDirection="column" gap={0}>
				<text fg={theme.fg}>
					<strong>Sign in</strong>
				</text>
				<text fg={theme.textDim}>1. Open {base || "the app"}/dashboard/settings</text>
				<text fg={theme.textDim}>2. Create a key in the CLI API keys card (shown once)</text>
				<text fg={theme.textDim}>3. Run qbtools login --api-key qbk_…</text>
			</box>
			<text fg={theme.textSubtle}>
				Favorites and run history sync to the server on login; offline they stay local.
			</text>
		</box>
	);
}
