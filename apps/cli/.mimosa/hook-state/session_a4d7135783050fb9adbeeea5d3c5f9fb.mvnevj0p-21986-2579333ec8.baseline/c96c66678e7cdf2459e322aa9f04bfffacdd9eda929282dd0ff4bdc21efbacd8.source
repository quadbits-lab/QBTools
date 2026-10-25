import { CLI_NAME, CLI_VERSION } from "../../version";
import { type Command, type CommandContext, EXIT_ERROR, EXIT_OK } from "../command";

export function renderUsage(commands: readonly Command[]): string {
	const lines: string[] = [];
	lines.push(`${CLI_NAME} ${CLI_VERSION} — QBTools in your terminal`);
	lines.push("");
	lines.push("Usage: qbtools [command] [flags]");
	lines.push("");
	lines.push("Commands:");
	const width = Math.max(...commands.map((c) => c.name.length));
	for (const command of commands) {
		lines.push(`  ${command.name.padEnd(width)}  ${command.summary}`);
	}
	lines.push("");
	lines.push("Run `qbtools` with no arguments for the interactive UI (requires a TTY).");
	lines.push("Run `qbtools help <command>` for flags and details.");
	return lines.join("\n");
}

export function renderCommandHelp(command: Command): string {
	const lines: string[] = [];
	lines.push(`${CLI_NAME} ${command.name} — ${command.summary}`);
	lines.push("");
	if (command.flags?.length) {
		lines.push("Flags:");
		for (const flag of command.flags) {
			const label = flag.arg === "value" ? `--${flag.name} <${flag.name}>` : `--${flag.name}`;
			lines.push(`  ${label.padEnd(24)}${flag.description}`);
		}
		lines.push("");
	}
	return lines.join("\n");
}

async function run(ctx: CommandContext & { commands: readonly Command[] }): Promise<number> {
	const { io } = ctx;
	const [target] = ctx.args.positional;
	if (!target) {
		io.out(renderUsage(ctx.commands));
		return EXIT_OK;
	}
	const command = ctx.commands.find((c) => c.name === target);
	if (!command) {
		io.err(`Unknown command: ${target}`);
		io.err(`Run \`${CLI_NAME} help\` to see available commands.`);
		return EXIT_ERROR;
	}
	io.out(renderCommandHelp(command));
	return EXIT_OK;
}

export function helpCommand(commands: () => readonly Command[]): Command {
	return {
		name: "help",
		summary: "Show help for commands",
		async run(ctx) {
			return run({ ...ctx, commands: commands() });
		},
	};
}
