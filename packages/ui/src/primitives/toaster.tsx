import { Toaster as Sonner, toast } from "sonner";

export { toast };

export function Toaster() {
	return (
		<Sonner
			position="bottom-center"
			toastOptions={{
				classNames: {
					toast:
						"!rounded-lg !border !border-border !bg-popover !text-popover-foreground !text-[0.95rem] !shadow-popover !font-sans",
					description: "!text-muted-foreground",
				},
			}}
		/>
	);
}
