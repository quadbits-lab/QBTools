import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselContextProps = {
	carouselRef: ReturnType<typeof useEmblaCarousel>[0];
	api: CarouselApi;
	scrollPrev: () => void;
	scrollNext: () => void;
	canScrollPrev: boolean;
	canScrollNext: boolean;
	orientation: "horizontal" | "vertical";
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
	const context = React.useContext(CarouselContext);
	if (!context) {
		throw new Error("useCarousel must be used within a <Carousel />");
	}
	return context;
}

/** Horizontal/vertical carousel built on Embla (shadcn base-carousel API). */
export function Carousel({
	orientation = "horizontal",
	opts,
	setApi,
	plugins,
	className,
	children,
	...props
}: React.ComponentProps<"div"> & {
	opts?: CarouselOptions;
	plugins?: CarouselPlugin;
	orientation?: "horizontal" | "vertical";
	setApi?: (api: CarouselApi) => void;
}) {
	const [carouselRef, api] = useEmblaCarousel(
		{ ...opts, axis: orientation === "horizontal" ? "x" : "y" },
		plugins,
	);
	const [canScrollPrev, setCanScrollPrev] = React.useState(false);
	const [canScrollNext, setCanScrollNext] = React.useState(false);

	const onSelect = React.useCallback((emblaApi: NonNullable<CarouselApi>) => {
		if (!emblaApi) return;
		setCanScrollPrev(emblaApi.canScrollPrev());
		setCanScrollNext(emblaApi.canScrollNext());
	}, []);

	const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
	const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);

	const handleKeyDown = React.useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				scrollPrev();
			} else if (event.key === "ArrowRight") {
				event.preventDefault();
				scrollNext();
			}
		},
		[scrollPrev, scrollNext],
	);

	React.useEffect(() => {
		if (!api || !setApi) return;
		setApi(api);
	}, [api, setApi]);

	React.useEffect(() => {
		if (!api) return;
		onSelect(api);
		api.on("reInit", onSelect);
		api.on("select", onSelect);
		return () => {
			api.off("select", onSelect);
			api.off("reInit", onSelect);
		};
	}, [api, onSelect]);

	return (
		<CarouselContext.Provider
			value={{
				carouselRef,
				api,
				scrollPrev,
				scrollNext,
				canScrollPrev,
				canScrollNext,
				orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
			}}
		>
			<div
				aria-roledescription="carousel"
				data-slot="carousel"
				tabIndex={0}
				onKeyDown={handleKeyDown}
				className={cn("relative", className)}
				{...props}
			>
				{children}
			</div>
		</CarouselContext.Provider>
	);
}

export function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
	const { carouselRef, orientation } = useCarousel();
	return (
		<div ref={carouselRef} className="overflow-hidden" data-slot="carousel-content">
			<div
				className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)}
				{...props}
			/>
		</div>
	);
}

export function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
	const { orientation } = useCarousel();
	return (
		<div
			aria-roledescription="slide"
			data-slot="carousel-item"
			className={cn(
				"min-w-0 shrink-0 grow-0 basis-full",
				orientation === "horizontal" ? "pl-4" : "pt-4",
				className,
			)}
			{...props}
		/>
	);
}

export function CarouselPrevious({
	className,
	variant = "outline",
	size = "icon-sm",
	...props
}: React.ComponentProps<typeof Button>) {
	const { scrollPrev, canScrollPrev } = useCarousel();
	return (
		<Button
			data-slot="carousel-previous"
			variant={variant}
			size={size}
			className={cn("shrink-0 rounded-full", className)}
			disabled={!canScrollPrev}
			onClick={scrollPrev}
			{...props}
		>
			<ArrowLeft aria-hidden="true" />
			<span className="sr-only">Previous slide</span>
		</Button>
	);
}

export function CarouselNext({
	className,
	variant = "outline",
	size = "icon-sm",
	...props
}: React.ComponentProps<typeof Button>) {
	const { scrollNext, canScrollNext } = useCarousel();
	return (
		<Button
			data-slot="carousel-next"
			variant={variant}
			size={size}
			className={cn("shrink-0 rounded-full", className)}
			disabled={!canScrollNext}
			onClick={scrollNext}
			{...props}
		>
			<ArrowRight aria-hidden="true" />
			<span className="sr-only">Next slide</span>
		</Button>
	);
}

export type { CarouselApi, CarouselOptions, CarouselPlugin };
export { useCarousel };
