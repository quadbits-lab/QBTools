/// <reference lib="webworker" />
import { type ProgressInfo, pipeline, RawImage } from "@huggingface/transformers";

/**
 * ormbg (Apache-2.0) — an ISNet-based general background remover. The int8
 * build is ~44MB and runs on the CPU via WASM, which works on every modern
 * browser (WebGPU runs fail on GPUs with low shader limits).
 */
const MODEL = "onnx-community/ormbg-ONNX";

export type WorkerRequest = { type: "run"; id: number; image: Blob };
export type WorkerResponse =
	| { type: "progress"; loaded: number; total: number }
	| { type: "status"; status: "loading" | "ready" | "working" }
	| { type: "result"; id: number; width: number; height: number; data: Uint8ClampedArray }
	| { type: "error"; id?: number; message: string };

const post = (message: WorkerResponse, transfer: Transferable[] = []) =>
	(self as DedicatedWorkerGlobalScope).postMessage(message, transfer);

const files = new Map<string, { loaded: number; total: number }>();
function onProgress(info: ProgressInfo) {
	if (info.status === "progress" && "file" in info) {
		files.set(info.file, { loaded: info.loaded, total: info.total });
		let loaded = 0;
		let total = 0;
		for (const f of files.values()) {
			loaded += f.loaded;
			total += f.total;
		}
		post({ type: "progress", loaded, total });
	}
}

type Segmenter = (image: RawImage) => Promise<RawImage | RawImage[]>;
let segmenter: Promise<Segmenter> | null = null;

async function createSegmenter(): Promise<Segmenter> {
	post({ type: "status", status: "loading" });
	const model = await pipeline("background-removal", MODEL, {
		device: "wasm",
		dtype: "q8",
		progress_callback: onProgress,
	});
	post({ type: "status", status: "ready" });
	return model as unknown as Segmenter;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
	const { id, image } = event.data;
	try {
		segmenter ??= createSegmenter();
		const run = await segmenter;
		post({ type: "status", status: "working" });
		const output = await run(await RawImage.fromBlob(image));
		const cutout = (Array.isArray(output) ? output[0] : output) as RawImage;
		const rgba = cutout.channels === 4 ? cutout : cutout.rgba();
		const data = new Uint8ClampedArray(rgba.data);
		post({ type: "result", id, width: rgba.width, height: rgba.height, data }, [data.buffer]);
	} catch (error) {
		segmenter = null;
		console.error(error);
		post({
			type: "error",
			id,
			message:
				"The AI couldn't process this photo. Please try a smaller image, or the latest Chrome, Edge, Safari or Firefox.",
		});
	}
};
