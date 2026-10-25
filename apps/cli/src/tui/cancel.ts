/**
 * Cancellation hook for a running tool.
 *
 * The shell owns Ctrl+C: it cancels the active run first and only quits when
 * nothing is running. The running screen registers its abort function here.
 */

let cancel: (() => void) | null = null;

export function setCancelHandler(handler: (() => void) | null): void {
	cancel = handler;
}

/** Cancel the running tool. Returns false when nothing is running. */
export function cancelRunning(): boolean {
	if (!cancel) return false;
	cancel();
	return true;
}

export function hasRunningTool(): boolean {
	return cancel !== null;
}
