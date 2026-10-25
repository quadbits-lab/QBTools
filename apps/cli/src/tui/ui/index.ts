/**
 * Ink component library for the QBTools CLI.
 *
 * Every component is presentational and controlled: they render props and
 * report intent through callbacks. Screens own the data.
 */

export type { KeyHandler, KeyHandlerOptions } from "./key-router";
export {
	CARD_KEY_PRIORITY,
	KeyRouterProvider,
	SCREEN_KEY_PRIORITY,
	SHELL_KEY_PRIORITY,
	useKeyHandler,
	WIDGET_KEY_PRIORITY,
} from "./key-router";
export type { SelectOption, SelectProps } from "./select";
export { Select } from "./select";
export type { SpinnerProps } from "./spinner";
export { SPINNER_FRAMES, Spinner, spinnerFrame } from "./spinner";
export type { TextAreaProps } from "./text-area";
export { TextArea, wrapLine } from "./text-area";
export type { TextInputProps } from "./text-input";
export { TextInput } from "./text-input";
export type { TerminalSize } from "./use-terminal-size";
export { useTerminalSize } from "./use-terminal-size";
