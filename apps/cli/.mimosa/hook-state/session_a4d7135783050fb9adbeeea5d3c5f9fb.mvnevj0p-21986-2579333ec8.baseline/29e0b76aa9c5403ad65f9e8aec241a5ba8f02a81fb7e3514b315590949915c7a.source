import { tools } from "@qbtools/registry";
import { type Command, type CommandFlagDoc, EXIT_ERROR, EXIT_OK } from "../command";

const SHELLS = ["zsh", "bash", "fish"] as const;
type Shell = (typeof SHELLS)[number];

function isShell(value: string): value is Shell {
	return (SHELLS as readonly string[]).includes(value);
}

function flagName(flag: CommandFlagDoc): string {
	return flag.arg === "value" ? `${flag.name}=` : flag.name;
}

function zshCompletions(commands: readonly { name: string; summary: string }[]): string {
	const commandLines = commands
		.map((command) => `    "${command.name}:${command.summary.replace(/"/g, '\\"')}"`)
		.join("\n");
	return `#compdef qbtools
# qbtools shell completions (zsh). Install:
#   qbtools completions zsh > ~/.zfunc/_qbtools   # with fpath=(~/.zfunc $fpath)
_qbtools() {
  local -a commands
  commands=(
${commandLines}
  )
  local -a slugs
  slugs=(
${tools.map((tool) => `    "${tool.slug}:${tool.name.replace(/:/g, "")}"`).join("\n")}
  )
  _arguments "1: :->command" "*:: :->args"
  case $state in
    command)
      _describe "command" commands
      ;;
    args)
      case $words[1] in
        run)
          _describe "tool" slugs
          ;;
        help)
          _describe "command" commands
          ;;
      esac
      ;;
  esac
}

if [ "$funcstack[1]" = "_qbtools" ]; then
  _qbtools
fi
`;
}

function bashCompletions(commands: readonly { name: string; flags?: CommandFlagDoc[] }[]): string {
	const names = commands.map((command) => command.name).join(" ");
	const slugs = tools.map((tool) => tool.slug).join(" ");
	const flagCases = commands
		.filter((command) => command.flags?.length)
		.map((command) => {
			const flags = command.flags?.map((flag) => `--${flagName(flag)}`).join(" ");
			return `    ${command.name})\n      COMPREPLY=( $(compgen -W "${flags}" -- "\${cur}") )\n      return ;;`;
		})
		.join("\n");
	return `# qbtools shell completions (bash). Install:
#   qbtools completions bash > ~/.local/share/bash-completion/completions/qbtools
_qbtools() {
  local cur prev commands slugs
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  commands="${names}"
  slugs="${slugs}"
  case "\${prev}" in
    run)
      COMPREPLY=( $(compgen -W "\${slugs}" -- "\${cur}") )
      return ;;
    help)
      COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
      return ;;
${flagCases}
  esac
  COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
}
complete -F _qbtools qbtools
`;
}

function fishCompletions(
	commands: readonly { name: string; summary: string; flags?: CommandFlagDoc[] }[],
): string {
	const lines: string[] = [
		"# qbtools shell completions (fish). Install:",
		"#   qbtools completions fish > ~/.config/fish/completions/qbtools.fish",
	];
	for (const command of commands) {
		const escaped = command.summary.replace(/"/g, '\\"');
		lines.push(
			`complete -c qbtools -n "__fish_use_subcommand" -a "${command.name}" -d "${escaped}"`,
		);
		if (command.flags?.length) {
			const condition = `__fish_seen_subcommand_from ${command.name}`;
			for (const flag of command.flags) {
				if (flag.arg === "value") {
					lines.push(
						`complete -c qbtools -n "${condition}" -l "${flag.name}" -d "${escaped}: ${flag.description}" -r`,
					);
				} else {
					lines.push(
						`complete -c qbtools -n "${condition}" -l "${flag.name}" -d "${flag.description}"`,
					);
				}
			}
		}
	}
	const slugList = tools.map((tool) => `${tool.slug}\t${tool.name}`).join(" ");
	lines.push(
		`complete -c qbtools -n "__fish_seen_subcommand_from run; and not __fish_seen_argument" -a "${slugList}"`,
	);
	lines.push("");
	return lines.join("\n");
}

export function completionsCommand(commands: () => readonly Command[]): Command {
	return {
		name: "completions",
		summary: "Emit shell completions (zsh | bash | fish)",
		flags: [
			{ name: "shell", arg: "value", description: "Target shell (positional also accepted)" },
		],
		async run({ args, io }) {
			const shell = args.positional[0] ?? "";
			if (!isShell(shell)) {
				io.err(`Missing or unsupported shell: ${shell || "(none)"}`);
				io.err(`Supported shells: ${SHELLS.join(", ")}`);
				io.err("Usage: qbtools completions <shell>");
				return EXIT_ERROR;
			}
			const registry = commands();
			switch (shell) {
				case "zsh":
					io.out(zshCompletions(registry));
					break;
				case "bash":
					io.out(bashCompletions(registry));
					break;
				case "fish":
					io.out(fishCompletions(registry));
					break;
			}
			return EXIT_OK;
		},
	};
}
