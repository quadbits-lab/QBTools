/**
 * Headless command contracts. Commands never touch the TUI — the interactive
 * surface is a separate entry that shares the runner/services layers.
 */

import type { ParsedArgs } from "./args";

export const EXIT_OK = 0;
export const EXIT_ERROR = 1;
/** Requested operation needs an optional dependency that is not installed. */
export const EXIT_UNAVAILABLE = 2;

export interface CommandIO {
	out(line?: string): void;
	err(line?: string): void;
}

export const consoleIO: CommandIO = {
	out(line) {
		process.stdout.write(`${line ?? ""}\n`);
	},
	err(line) {
		process.stderr.write(`${line ?? ""}\n`);
	},
};

export interface CommandFlagDoc {
	name: string;
	/** "value" when the flag takes an argument, omitted for booleans. */
	arg?: "value";
	description: string;
}

export interface CommandContext {
	args: ParsedArgs;
	io: CommandIO;
}

export interface Command {
	name: string;
	summary: string;
	flags?: CommandFlagDoc[];
	run(ctx: CommandContext): Promise<number>;
}
