import type { ProcessingProgress } from "@qbtools/engines/processing";
import { Button } from "@qbtools/ui/button";
import { Progress } from "@qbtools/ui/progress";
export function TaskProgress({
	busy,
	progress,
	cancel,
}: {
	busy: boolean;
	progress: ProcessingProgress | null;
	cancel: () => void;
}) {
	if (!busy) return null;
	return (
		<div className="flex flex-col gap-3">
			<Progress
				value={progress?.fraction == null ? null : progress.fraction * 100}
				label={progress?.label ?? "Loading processing engine…"}
			/>
			<Button variant="outline" className="self-start" onClick={cancel}>
				Cancel
			</Button>
		</div>
	);
}
