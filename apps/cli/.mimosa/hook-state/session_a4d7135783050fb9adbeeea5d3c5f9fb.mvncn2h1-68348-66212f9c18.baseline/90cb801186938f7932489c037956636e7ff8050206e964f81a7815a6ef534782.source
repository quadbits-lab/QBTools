/**
 * Minimal flag parser for headless mode. No dependencies.
 *
 * Supported syntax:
 *   --flag              boolean true
 *   --flag=value        string
 *   --flag value        string (when the next token is not another flag)
 *   --a --a b           repeated flags collect into an array
 *   --                  everything after is positional
 *   everything else     positional (order preserved)
 */

type FlagValue = string | boolean | string[];

export interface ParsedArgs {
	positional: string[];
	flags: Map<string, FlagValue>;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
	const positional: string[] = [];
	const flags = new Map<string, FlagValue>();
	let onlyPositional = false;

	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (token === undefined) continue;
		if (!onlyPositional && token === "--") {
			onlyPositional = true;
			continue;
		}
		if (!onlyPositional && token.startsWith("--")) {
			const body = token.slice(2);
			const eq = body.indexOf("=");
			if (eq >= 0) {
				pushFlag(flags, body.slice(0, eq), body.slice(eq + 1));
				continue;
			}
			const next = argv[i + 1];
			if (next !== undefined && !next.startsWith("--")) {
				pushFlag(flags, body, next);
				i++;
				continue;
			}
			pushFlag(flags, body, true);
			continue;
		}
		positional.push(token);
	}

	return { positional, flags };
}

function pushFlag(flags: Map<string, FlagValue>, name: string, value: string | boolean): void {
	const existing = flags.get(name);
	if (existing === undefined) {
		flags.set(name, value);
		return;
	}
	if (typeof value === "boolean") {
		// repeated booleans stay boolean
		flags.set(name, value);
		return;
	}
	const values: string[] =
		typeof existing === "boolean" ? [] : Array.isArray(existing) ? [...existing] : [existing];
	values.push(value);
	flags.set(name, values);
}

/** Get a string flag value (last one wins when repeated). */
export function getString(args: ParsedArgs, name: string): string | undefined {
	const value = args.flags.get(name);
	if (value === undefined || typeof value === "boolean") return undefined;
	return Array.isArray(value) ? value[value.length - 1] : value;
}

/** Get all values collected for a flag. */
export function getAll(args: ParsedArgs, name: string): string[] {
	const value = args.flags.get(name);
	if (value === undefined || typeof value === "boolean") return [];
	return Array.isArray(value) ? value : [value];
}

/** Get a boolean flag (`--flag` present, or `--flag=true|false`). */
export function getBool(args: ParsedArgs, name: string): boolean {
	const value = args.flags.get(name);
	if (value === undefined) return false;
	if (typeof value === "boolean") return value;
	const last = Array.isArray(value) ? value[value.length - 1] : value;
	return last === "true" || last === "1" || last === "yes";
}
