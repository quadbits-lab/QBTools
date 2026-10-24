import { Menu } from "lucide-react";
import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "../lib/utils";

const SidebarContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
	open: false,
	setOpen: () => {},
});

export const useSidebar = () => React.useContext(SidebarContext);

/** App shell: a 256px sidebar beside the content on large screens, a drawer below 1024px. */
export function SidebarProvider({ className, ...props }: React.ComponentProps<"div">) {
	const [open, setOpen] = React.useState(false);
	const value = React.useMemo(() => ({ open, setOpen }), [open]);
	return (
		<SidebarContext.Provider value={value}>
			<div className={cn("flex min-h-dvh w-full", className)} {...props} />
		</SidebarContext.Provider>
	);
}

export function Sidebar({ className, children, ...props }: React.ComponentProps<"aside">) {
	const { open, setOpen } = useSidebar();
	return (
		<>
			{open ? (
				<button
					type="button"
					aria-label="Close sidebar"
					onClick={() => setOpen(false)}
					className="fixed inset-0 z-40 bg-veil backdrop-blur-sm lg:hidden"
				/>
			) : null}
			<aside
				data-open={open}
				className={cn(
					"fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 data-[open=true]:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0",
					className,
				)}
				{...props}
			>
				{children}
			</aside>
		</>
	);
}

export function SidebarTrigger({ className, ...props }: React.ComponentProps<"button">) {
	const { open, setOpen } = useSidebar();
	return (
		<button
			type="button"
			aria-label="Open sidebar"
			aria-expanded={open}
			onClick={() => setOpen(!open)}
			className={cn(
				"inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-input hover:bg-accent lg:hidden",
				className,
			)}
			{...props}
		>
			<Menu className="size-4" />
		</button>
	);
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex h-16 shrink-0 items-center border-b border-sidebar-border px-4",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div className={cn("flex flex-1 flex-col gap-5 overflow-y-auto p-3", className)} {...props} />
	);
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div className={cn("shrink-0 border-t border-sidebar-border p-3", className)} {...props} />
	);
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"px-2 pb-1 font-mono text-[0.625rem] font-medium uppercase tracking-[0.1em] text-subtle",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
	return <ul className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function SidebarMenuItem(props: React.ComponentProps<"li">) {
	return <li {...props} />;
}

/** Nav row. Use `asChild` with a router `Link`; mark the current page with `isActive`. */
export function SidebarMenuButton({
	asChild = false,
	isActive = false,
	className,
	...props
}: React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean }) {
	const Comp = asChild ? Slot.Root : "button";
	return (
		<Comp
			data-active={isActive}
			aria-current={isActive ? "page" : undefined}
			className={cn(
				"flex h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground [&_svg]:size-4 [&_svg]:shrink-0",
				className,
			)}
			{...props}
		/>
	);
}

export function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
	return <div className={cn("flex min-w-0 flex-1 flex-col", className)} {...props} />;
}
