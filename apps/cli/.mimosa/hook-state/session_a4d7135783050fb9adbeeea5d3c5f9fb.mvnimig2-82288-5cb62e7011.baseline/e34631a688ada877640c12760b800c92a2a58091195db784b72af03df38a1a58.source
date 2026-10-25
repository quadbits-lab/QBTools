/**
 * Headless command registry. Commands are ordered for help output.
 */

import { authCommands } from "./cmd/auth";
import { cleanupCommand } from "./cmd/cleanup";
import { completionsCommand } from "./cmd/completions";
import { infoCommand, openCommand, searchCommand } from "./cmd/discover";
import { doctorCommand } from "./cmd/doctor";
import { helpCommand } from "./cmd/help";
import { listCommand } from "./cmd/list";
import { mediaCommand } from "./cmd/media";
import { runCommand } from "./cmd/run";
import { versionCommand } from "./cmd/version";
import type { Command } from "./command";

export const COMMANDS: Command[] = [
	versionCommand,
	listCommand,
	runCommand,
	searchCommand,
	infoCommand,
	openCommand,
	cleanupCommand,
	doctorCommand,
	mediaCommand,
	...authCommands,
	helpCommand((): readonly Command[] => COMMANDS),
	completionsCommand((): readonly Command[] => COMMANDS),
];

export function findCommand(name: string): Command | undefined {
	return COMMANDS.find((command) => command.name === name);
}
