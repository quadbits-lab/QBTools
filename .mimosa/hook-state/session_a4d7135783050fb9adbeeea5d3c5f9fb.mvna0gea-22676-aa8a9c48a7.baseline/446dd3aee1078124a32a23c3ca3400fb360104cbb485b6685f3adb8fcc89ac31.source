import { assetBase } from "../assets";

export interface Qpdf {
	callMain(args: string[]): number;
	WORKERFS: unknown;
	FS: {
		mkdir(path: string): void;
		mount(type: unknown, options: { blobs: { name: string; data: Blob }[] }, path: string): void;
		unmount(path: string): void;
		readFile(path: string): Uint8Array;
		unlink(path: string): void;
	};
}
let engine: Promise<Qpdf> | null = null;
/** Shared qpdf instance. Must run in a dedicated worker: callMain is synchronous. */
export function getQpdf(): Promise<Qpdf> {
	engine ??= (async () => {
		const base = await assetBase("qpdf");
		const { default: createModule } = await import("@neslinesli93/qpdf-wasm");
		const create = createModule as unknown as (options: {
			locateFile: () => string;
			noInitialRun: boolean;
			print: () => void;
			printErr: () => void;
		}) => Promise<Qpdf>;
		const module = await create({
			locateFile: () => `${base}/qpdf.wasm`,
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
