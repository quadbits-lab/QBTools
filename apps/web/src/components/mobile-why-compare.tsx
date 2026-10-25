import { Badge } from "@qbtools/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qbtools/ui/tabs";
import { cn } from "@qbtools/ui/utils";
import { ToolTag } from "#/components/tool-flags";

type Steps = ReadonlyArray<readonly [string, string]>;

const TONE = {
	emerald: {
		number: "border-cat-emerald-border bg-cat-emerald-bg text-cat-emerald-fg",
	},
	rose: {
		number: "border-cat-rose-border bg-cat-rose-bg text-cat-rose-fg",
	},
} as const;

/**
 * Mobile-only engine comparison: a compact two-tab card that swaps the step
 * list instead of stacking two tall cards. Hidden from `sm` upwards.
 */
export function MobileWhyCompare({
	browserSteps,
	cloudSteps,
}: {
	browserSteps: Steps;
	cloudSteps: Steps;
}) {
	const modes = [
		{
			value: "browser",
			tab: "In your browser",
			title: "QBTools in-browser engine",
			badge: <ToolTag type="private" />,
			tone: "emerald" as const,
			steps: browserSteps,
		},
		{
			value: "cloud",
			tab: "Cloud tools",
			title: "Typical cloud converters",
			badge: <Badge tone="critical">Uploads your file</Badge>,
			tone: "rose" as const,
			steps: cloudSteps,
		},
	];

	return (
		<div className="rounded-xl border border-border bg-card p-4">
			<Tabs defaultValue="browser" className="gap-4">
				<TabsList className="w-full">
					{modes.map((mode) => (
						<TabsTrigger key={mode.value} value={mode.value} className="flex-1">
							{mode.tab}
						</TabsTrigger>
					))}
				</TabsList>

				{modes.map((mode) => (
					<TabsContent key={mode.value} value={mode.value} className="mt-0">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-base leading-5 font-semibold tracking-[-0.02em] text-foreground">
								{mode.title}
							</h3>
							{mode.badge}
						</div>

						<ol className="mt-3.5 flex flex-col gap-2.5">
							{mode.steps.map(([step, text], index) => (
								<li key={step} className="flex gap-2.5">
									<span
										className={cn(
											"mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[0.625rem] leading-none",
											TONE[mode.tone].number,
										)}
									>
										{index + 1}
									</span>
									<span className="flex min-w-0 flex-col">
										<span className="text-sm leading-5 font-medium text-foreground">{step}</span>
										<span className="text-xs leading-4 text-muted-foreground">{text}</span>
									</span>
								</li>
							))}
						</ol>
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
