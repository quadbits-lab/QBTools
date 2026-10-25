/**
 * Terminal dimensions. Ink exposes the output stream but not its size, so
 * read `columns`/`rows` from the stream and follow its `resize` event.
 * `QBTOOLS_TUI_SIZE` (e.g. "120x40") pins the size deterministically — used
 * by tests and handy for pipes; the fallback keeps rendering sane otherwise.
 */

import { useStdout } from "ink";
import { useEffect, useState } from "react";

export interface TerminalSize {
	columns: number;
	rows: number;
}

export const DEFAULT_TERMINAL_SIZE: TerminalSize = { columns: 80, rows: 30 };

function readSize(stream: NodeJS.WriteStream | undefined): TerminalSize {
	const override = process.env.QBTOOLS_TUI_SIZE;
	if (override) {
		const [columns = DEFAULT_TERMINAL_SIZE.columns, rows = DEFAULT_TERMINAL_SIZE.rows] = override
			.split("x")
			.map((part) => Number.parseInt(part, 10));
		if (Number.isFinite(columns) && Number.isFinite(rows)) return { columns, rows };
	}
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
