/**
 * Spinner — braille frame cycle with an optional label. The frame math is a
 * pure helper so tests can assert it without timers.
 */

import { Text } from "ink";
import { useEffect, useState } from "react";
import { theme } from "../theme";

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;
const SPINNER_INTERVAL_MS = 80;

export function spinnerFrame(tick: number): string {
	const index = ((tick % SPINNER_FRAMES.length) + SPINNER_FRAMES.length) % SPINNER_FRAMES.length;
	return SPINNER_FRAMES[index] ?? SPINNER_FRAMES[0];
}

export interface SpinnerProps {
	label?: string;
	/** Fixed frame — static mode for tests. */
	frame?: number;
}

export function Spinner(props: SpinnerProps) {
	const [tick, setTick] = useState(props.frame ?? 0);
	useEffect(() => {
		if (props.frame !== undefined) return; // static mode (tests)
		const timer = setInterval(() => setTick((t) => t + 1), SPINNER_INTERVAL_MS);
		return () => clearInterval(timer);
	}, [props.frame]);
	return (
		<Text>
			<Text color={theme.text.accent}>{spinnerFrame(tick)}</Text>
			{props.label ? <Text color={theme.text.secondary}> {props.label}</Text> : null}
		</Text>
	);
}
