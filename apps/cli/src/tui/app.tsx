/**
 * TUI host. The console owns the screen; the key router owns the keyboard.
 */

import { Console } from "./console";
import { KeyRouterProvider } from "./ui";

export function App() {
	return (
		<KeyRouterProvider>
			<Console />
		</KeyRouterProvider>
	);
}
