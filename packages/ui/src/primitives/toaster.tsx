import { Toaster as Sonner, toast } from "sonner";

export { toast };

export function Toaster() {
	return (
		<Sonner
			position="bottom-center"
			toastOptions={{
				classNames: {
					toast:
						"!rounded-xl !border !border-border !bg-surface !text-foreground !text-base !shadow-lg",
					description: "!text-muted-foreground",
				},
			}}
		/>
	);
}
