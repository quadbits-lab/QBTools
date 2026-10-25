/**
 * Key routing: OpenTUI focused widgets consume their own keystrokes, so the
 * shell registers ONE handler that handles globals and then falls through to
 * the active screen's handler. Two tiers prevent the shell handler from
 * dispatching to itself.
 *
 * - setShellHandler: App, once per screen change. Return true = consumed.
 * - setKeyHandler:   active screen (tool/cleanup/settings), cleared on unmount.
 */

export interface DispatchKey {
	name: string;
	ctrl?: boolean;
	shift?: boolean;
	meta?: boolean;
}

type ShellHandler = ((key: DispatchKey) => boolean | void) | null;
type ScreenHandler = ((key: DispatchKey) => void) | null;

let shell: ShellHandler = null;
let screen: ScreenHandler = null;

export function setShellHandler(handler: ShellHandler): void {
	shell = handler;
}

export function setKeyHandler(handler: ScreenHandler): void {
	screen = handler;
}

/** Shell first; unconsumed keys flow to the active screen. */
export function dispatchKey(key: DispatchKey): void {
	const consumed = shell?.(key);
	if (consumed === true) return;
	screen?.(key);
}
