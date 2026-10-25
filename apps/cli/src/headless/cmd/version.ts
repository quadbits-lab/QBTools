import { CLI_NAME, CLI_VERSION } from "../../version";
import { getBool } from "../args";
import { type Command, EXIT_OK } from "../command";

export const versionCommand: Command = {
	name: "version",
	summary: "Print the qbtools version",
	flags: [{ name: "json", description: "Print as JSON" }],
	async run({ args, io }) {
		if (getBool(args, "json")) {
			io.out(JSON.stringify({ name: CLI_NAME, version: CLI_VERSION }));
			return EXIT_OK;
		}
		io.out(`${CLI_NAME} ${CLI_VERSION}`);
		return EXIT_OK;
	},
};
