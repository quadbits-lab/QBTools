/**
 * Headless dispatcher: argv → command → exit code.
 */

import { parseArgs } from "./args";
import { type CommandIO, consoleIO, EXIT_ERROR } from "./command";
import { COMMANDS, findCommand } from "./commands";

export async function runHeadless(
	argv: readonly string[],
	io: CommandIO = consoleIO,
): Promise<number> {
	const [name, ...rest] = argv;
	if (!name) {
		io.err(
			"Nothing to do. Run `qbtools help` for commands, or `qbtools` with no arguments for the UI.",
		);
		return EXIT_ERROR;
	}
	const command = findCommand(name);
	if (!command) {
		const { nearestNames } = await import("../services/file-suggest");
		const suggestions = nearestNames(
			name,
			COMMANDS.map((candidate) => candidate.name),
		);
		io.err(`Unknown command: ${name}`);
		if (suggestions.length) io.err(`Did you mean: ${suggestions.join(", ")}?`);
		else io.err("Run `qbtools help` to see available commands.");
		return EXIT_ERROR;
	}
	try {
		return await command.run({ args: parseArgs(rest), io });
	} catch (error) {
		io.err(`${command.name} failed: ${error instanceof Error ? error.message : String(error)}`);
		return EXIT_ERROR;
	}
}
