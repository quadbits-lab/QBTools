import { type VectorizeOptions, vectorizeRgba } from "@qbtools/engines/vectorize";

export interface WorkerRequest {
	id: string;
	type: "vectorize";
	rgba: Uint8Array;
	width: number;
	height: number;
	options: VectorizeOptions;
	wasmUrl: string;
}

export type WorkerResponse =
	| {
			id: string;
			type: "result";
			svg: string;
			width: number;
			height: number;
			pathsCount: number;
			colorsCount: number;
			durationMs: number;
	  }
	| {
			id: string;
			type: "error";
			message: string;
	  };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
	const { id, rgba, width, height, options, wasmUrl } = event.data;
	try {
		const result = await vectorizeRgba(rgba, width, height, options, wasmUrl);
		self.postMessage({
			id,
			type: "result",
			svg: result.svg,
			width: result.width,
			height: result.height,
			pathsCount: result.pathsCount,
			colorsCount: result.colorsCount,
			durationMs: result.durationMs,
		} satisfies WorkerResponse);
	} catch (err: unknown) {
		self.postMessage({
			id,
			type: "error",
			message:
				err instanceof Error
					? err.message
					: "Vectorization failed. Please check the image and try again.",
		} satisfies WorkerResponse);
	}
};
