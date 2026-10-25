import type { ToolDef, ToolPreset } from "@qbtools/registry";

export type ToolParams = ToolPreset["params"];

export interface ToolWidgetProps {
	tool: ToolDef;
	/** Options from a preset landing page, e.g. { targetKb: 100 }. */
	params: ToolParams;
}

export const numParam = (params: ToolParams, key: string): number | undefined => {
	const value = params[key];
	return typeof value === "number" ? value : undefined;
};

export const strParam = (params: ToolParams, key: string): string | undefined => {
	const value = params[key];
	return typeof value === "string" ? value : undefined;
};

export const boolParam = (params: ToolParams, key: string): boolean | undefined => {
	const value = params[key];
	return typeof value === "boolean" ? value : undefined;
};
