/**
 * Headless command registry. Commands are ordered for help output.
 */

import type { Command } from "./command";
import { completionsCommand } from "./cmd/completions";
import { helpCommand } from "./cmd/help";
import { infoCommand, openCommand, searchCommand } from "./cmd/discover";
import { listCommand } from "./cmd/list";
import { runCommand } from "./cmd/run";
import { versionCommand } from "./cmd/version";

export const COMMANDS: Command[] = [
	versionCommand,
	listCommand,
	runCommand,
	searchCommand,
	infoCommand,
	openCommand,
	helpCommand((): readonly Command[] => COMMANDS),
	completionsCommand((): readonly Command[] => COMMANDS),
];

export function findCommand(name: string): Command | undefined {
	return COMMANDS.find((command) => command.name === name);
}
