/**
 * Headless command registry. Commands are ordered for help output.
 */

import { completionsCommand } from "./cmd/completions";
import { helpCommand } from "./cmd/help";
import { listCommand } from "./cmd/list";
import { versionCommand } from "./cmd/version";
import type { Command } from "./command";

export const COMMANDS: Command[] = [
	versionCommand,
	listCommand,
	helpCommand((): readonly Command[] => COMMANDS),
	completionsCommand((): readonly Command[] => COMMANDS),
];

export function findCommand(name: string): Command | undefined {
	return COMMANDS.find((command) => command.name === name);
}
