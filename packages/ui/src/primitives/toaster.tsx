import { Toaster as Sonner, toast } from "sonner";

export { toast };

export function Toaster() {
	return (
		<Sonner
			position="bottom-center"
			toastOptions={{
				classNames: {
					toast:
						"!rounded-none !border !border-input !bg-surface !text-foreground !text-[0.95rem] !shadow-none !font-sans",
					description: "!text-muted-foreground",
				},
			}}
		/>
	);
}
