import { assetBase } from "../assets";

export interface Qpdf {
	callMain(args: string[]): number;
	WORKERFS: unknown;
	FS: {
		mkdir(path: string): void;
		mount(type: unknown, options: { blobs: { name: string; data: Blob }[] }, path: string): void;
		unmount(path: string): void;
		writeFile(path: string, data: Uint8Array): void;
		readFile(path: string): Uint8Array;
		unlink(path: string): void;
	};
}
/**
 * Stage an input file under /input/source.pdf. Browser workers mount WORKERFS
 * (streams the Blob without double-buffering); headless Bun has no
 * FileReaderSync, so the bytes are written straight into MEMFS.
 * Returns whether a WORKERFS mount must be unmounted afterwards.
 */
export async function stageInput(qpdf: Qpdf, file: File): Promise<boolean> {
	if (typeof (globalThis as { FileReaderSync?: unknown }).FileReaderSync === "undefined") {
		qpdf.FS.writeFile("/input/source.pdf", new Uint8Array(await file.arrayBuffer()));
		return false;
	}
	qpdf.FS.mount(qpdf.WORKERFS, { blobs: [{ name: "source.pdf", data: file }] }, "/input");
	return true;
}
let engine: Promise<Qpdf> | null = null;
/** Shared qpdf instance. Must run in a dedicated worker: callMain is synchronous. */
export function getQpdf(): Promise<Qpdf> {
	engine ??= (async () => {
		const base = await assetBase("qpdf");
		const { default: createModule } = await import("@neslinesli93/qpdf-wasm");
		const create = createModule as unknown as (options: {
			locateFile?: () => string;
			wasmBinary?: Uint8Array;
			noInitialRun: boolean;
			print: () => void;
			printErr: () => void;
		}) => Promise<Qpdf>;
		// Headless callers get a file:// base whose loader can't be located the
		// emscripten way, so hand the wasm bytes over directly.
		const headlessOptions = base.startsWith("file://")
			? {
					wasmBinary: new Uint8Array(await (await fetch(`${base}/qpdf.wasm`)).arrayBuffer()),
				}
			: { locateFile: () => `${base}/qpdf.wasm` };
		const module = await create({
			...headlessOptions,
			noInitialRun: true,
			print: () => {},
			printErr: () => {},
		});
		module.FS.mkdir("/input");
		return module;
	})().catch((error) => {
		engine = null;
		throw error;
	});
	return engine;
}
/** Run qpdf and return its exit code; emscripten reports exit() as a thrown status. */
export function runQpdf(qpdf: Qpdf, args: string[]): number {
	try {
		return qpdf.callMain(args);
	} catch (error) {
		const status = (error as { status?: number }).status;
		if (status === undefined) throw error;
		return status;
	}
}
