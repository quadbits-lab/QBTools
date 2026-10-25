/**
 * Terminal dimensions. Ink exposes the output stream but not its size, so
 * read `columns`/`rows` from the stream and follow its `resize` event.
 * The fallback keeps rendering sane in non-TTY contexts (tests, pipes).
 */

import { useStdout } from "ink";
import { useEffect, useState } from "react";

export interface TerminalSize {
	columns: number;
	rows: number;
}

export const DEFAULT_TERMINAL_SIZE: TerminalSize = { columns: 80, rows: 30 };

function readSize(stream: NodeJS.WriteStream | undefined): TerminalSize {
	const columns = stream?.columns ?? DEFAULT_TERMINAL_SIZE.columns;
	const rows = stream?.rows ?? DEFAULT_TERMINAL_SIZE.rows;
	return { columns, rows };
}

export function useTerminalSize(): TerminalSize {
	const { stdout } = useStdout();
	const [size, setSize] = useState<TerminalSize>(() => readSize(stdout));

	useEffect(() => {
		if (!stdout) return;
		const onResize = () => setSize(readSize(stdout));
		onResize();
		stdout.on("resize", onResize);
		return () => {
			stdout.off("resize", onResize);
		};
	}, [stdout]);

	return size;
}
