/**
 * Raster image vectorizer using VTracer WebAssembly.
 * Converts PNG, JPEG, WebP, or raw RGBA pixels to scalable SVG vectors.
 */

import { readFile } from "node:fs/promises";
import { assetBase } from "../assets";
import { checkAbort, type ProcessingOptions } from "../processing";

export type VectorizePreset = "logo" | "bw" | "photo" | "poster" | "pixel";

export interface VectorizeOptions extends ProcessingOptions {
	/** Preset configuration to quickly tune parameters */
	preset?: VectorizePreset;
	/** Path fitting mode: 'spline' (Bézier curves), 'polygon' (straight lines), 'pixel' (crisp blocks) */
	mode?: "spline" | "polygon" | "pixel";
	/** Region clustering algorithm */
	clustering?: "color-cluster" | "bw" | "watershed";
	/** Layer stacking mode: 'stacked' (overlapping shapes) or 'cutout' (holes cut out) */
	hierarchical?: "stacked" | "cutout";
	/** Filter speckles/noise below this area in pixels (0..=64) */
	filterSpeckle?: number;
	/** Color precision bits (1..=8, default 6) */
	colorPrecision?: number;
	/** Layer color difference tolerance (1..=255, default 16) */
	layerDifference?: number;
	/** Corner angle threshold in degrees (0..=180, default 60) */
	cornerThreshold?: number;
	/** Length threshold for subdivision (default 4) */
	lengthThreshold?: number;
	/** Maximum curve fitting iterations (default 10) */
	maxIterations?: number;
	/** Splice angle threshold in degrees (default 45) */
	spliceThreshold?: number;
	/** Curve simplification tolerance in px (e.g. 0 to 4; null/undefined = off) */
	simplify?: number;
	/** Path coordinates decimal precision (default 2) */
	pathPrecision?: number;
	/** Auto-quantize target max colors count (2..=64) */
	maxColors?: number;
	/** SVG optimization level (0 = off, 1 = quantize+simplify, 2 = shorthands/grouping) */
	optimize?: number;
	/** Binary mode threshold (0..=255, default 128) */
	binaryThreshold?: number;
	/** Binary mode: use Bradley-Roth adaptive thresholding for uneven lighting */
	adaptive?: boolean;
	/** Adaptive window side length in px (0 = auto ~1/8 of shorter side) */
	adaptiveWindow?: number;
	/** Adaptive sensitivity percentage below local mean (default 15) */
	adaptiveT?: number;
	/** Invert black and white in binary mode */
	invert?: boolean;
}

export interface VectorizeResult {
	svg: string;
	width: number;
	height: number;
	pathsCount: number;
	colorsCount: number;
	durationMs: number;
}

export interface VtracerEngine {
	vectorizeRgba(
		rgba: Uint8Array,
		width: number,
		height: number,
		options?: Record<string, unknown>,
	): string;
	vectorizeBytes(bytes: Uint8Array, options?: Record<string, unknown>): string;
}

let cachedEngine: Promise<VtracerEngine> | null = null;
let cachedSourceKey = "";

/**
 * Instantiate the VTracer WebAssembly engine with pure JS bindings.
 * Works seamlessly in both browser/worker environments and Node/Bun tests.
 */
export async function initVtracer(
	wasmSource?: string | ArrayBuffer | Uint8Array,
): Promise<VtracerEngine> {
	const sourceKey = typeof wasmSource === "string" ? wasmSource : wasmSource ? "buffer" : "auto";
	if (cachedEngine && cachedSourceKey === sourceKey) {
		return cachedEngine;
	}

	cachedSourceKey = sourceKey;
	cachedEngine = (async () => {
		let wasmBuffer: ArrayBuffer | Uint8Array;

		if (wasmSource instanceof Uint8Array || wasmSource instanceof ArrayBuffer) {
			wasmBuffer = wasmSource;
		} else if (typeof wasmSource === "string" && wasmSource.length > 0) {
			const res = await fetch(wasmSource);
			if (!res.ok) throw new Error(`Failed to load vectorizer WASM from ${wasmSource}`);
			wasmBuffer = await res.arrayBuffer();
		} else if (typeof document === "undefined" && typeof location === "undefined") {
			// Bun / Node testing environment
			const wasmPath = Bun.resolveSync(
				"@visioncortex/vtracer/pkg/vtracer_wasm_bg.wasm",
				import.meta.dir,
			);
			wasmBuffer = await readFile(wasmPath);
		} else {
			// Browser / Worker environment: resolve from versioned same-origin assetBase
			const base = await assetBase("vtracer");
			const res = await fetch(`${base}/vtracer_wasm_bg.wasm`);
			if (!res.ok) throw new Error("Failed to load vectorizer assets.");
			wasmBuffer = await res.arrayBuffer();
		}

		return createVtracerInstance(wasmBuffer);
	})().catch((err) => {
		cachedEngine = null;
		throw err;
	});

	return cachedEngine;
}

function createVtracerInstance(wasmSource: ArrayBuffer | Uint8Array): VtracerEngine {
	let wasm: any;
	const cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
	cachedTextDecoder.decode();
	const cachedTextEncoder = new TextEncoder();
	let WASM_VECTOR_LEN = 0;
	let cachedUint8ArrayMemory0: Uint8Array | null = null;
	let cachedDataViewMemory0: DataView | null = null;

	function decodeText(ptr: number, len: number) {
		return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
	}

	function getUint8ArrayMemory0() {
		if (
			cachedUint8ArrayMemory0 === null ||
			cachedUint8ArrayMemory0.byteLength === 0 ||
			cachedUint8ArrayMemory0.buffer !== wasm.memory.buffer
		) {
			cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
		}
		return cachedUint8ArrayMemory0;
	}

	function getDataViewMemory0() {
		const buf = cachedDataViewMemory0?.buffer as { detached?: boolean } | undefined;
		if (
			cachedDataViewMemory0 === null ||
			buf?.detached === true ||
			(buf?.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)
		) {
			cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
		}
		return cachedDataViewMemory0;
	}

	function isLikeNone(x: unknown): x is undefined | null {
		return x === undefined || x === null;
	}

	function passArray8ToWasm0(arg: Uint8Array, malloc: (len: number, align: number) => number) {
		const ptr = malloc(arg.length * 1, 1) >>> 0;
		getUint8ArrayMemory0().set(arg, ptr);
		WASM_VECTOR_LEN = arg.length;
		return ptr;
	}

	function passStringToWasm0(
		arg: string,
		malloc: (len: number, align: number) => number,
		realloc?: (ptr: number, oldLen: number, newLen: number, align: number) => number,
	) {
		if (realloc === undefined) {
			const buf = cachedTextEncoder.encode(arg);
			const ptr = malloc(buf.length, 1) >>> 0;
			getUint8ArrayMemory0()
				.subarray(ptr, ptr + buf.length)
				.set(buf);
			WASM_VECTOR_LEN = buf.length;
			return ptr;
		}

		let len = arg.length;
		let ptr = malloc(len, 1) >>> 0;
		const mem = getUint8ArrayMemory0();
		let offset = 0;

		for (; offset < len; offset++) {
			const code = arg.charCodeAt(offset);
			if (code > 0x7f) break;
			mem[ptr + offset] = code;
		}

		if (offset !== len) {
			if (offset !== 0) arg = arg.slice(offset);
			len = offset + arg.length * 3;
			ptr = realloc(ptr, len, len, 1) >>> 0;
			const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
			const ret = cachedTextEncoder.encodeInto(arg, view);
			offset += ret.written;
			ptr = realloc(ptr, len, offset, 1) >>> 0;
		}

		WASM_VECTOR_LEN = offset;
		return ptr;
	}

	function getStringFromWasm0(ptr: number, len: number) {
		return decodeText(ptr >>> 0, len);
	}

	function addToExternrefTable0(obj: unknown) {
		const idx = wasm.__externref_table_alloc();
		wasm.__wbindgen_externrefs.set(idx, obj);
		return idx;
	}

	function takeFromExternrefTable0(idx: number) {
		const value = wasm.__wbindgen_externrefs.get(idx);
		wasm.__externref_table_dealloc(idx);
		return value;
	}

	function handleError(f: (...args: any[]) => any, args: any[]) {
		try {
			return f(...args);
		} catch (e) {
			const idx = addToExternrefTable0(e);
			wasm.__wbindgen_exn_store(idx);
		}
	}

	function debugString(val: unknown) {
		if (typeof val === "number" || typeof val === "boolean" || val == null) return String(val);
		if (typeof val === "string") return JSON.stringify(val);
		return String(val);
	}

	function getArrayU8FromWasm0(ptr: number, len: number) {
		return getUint8ArrayMemory0().subarray(ptr >>> 0, (ptr >>> 0) + len);
	}

	const import0: Record<string, any> = {
		__proto__: null,
		__wbg_Error_92b29b0548f8b746: (arg0: number, arg1: number) =>
			Error(getStringFromWasm0(arg0, arg1)),
		__wbg_Number_9a4e0ecb0fa16705: (arg0: unknown) => Number(arg0),
		__wbg_String_8564e559799eccda: (arg0: number, arg1: unknown) => {
			const ret = String(arg1);
			const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
			const len1 = WASM_VECTOR_LEN;
			getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
			getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
		},
		__wbg___wbindgen_bigint_get_as_i64_d968e41184ae354f: (arg0: number, arg1: unknown) => {
			const v = arg1;
			const ret = typeof v === "bigint" ? v : undefined;
			getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
			getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret) ? 1 : 0, true);
		},
		__wbg___wbindgen_boolean_get_fa956cfa2d1bd751: (arg0: unknown) =>
			isLikeNone(arg0) ? 0xffffff : arg0 ? 1 : 0,
		__wbg___wbindgen_debug_string_c25d447a39f5578f: (arg0: number, arg1: unknown) => {
			const ret = debugString(arg1);
			const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
			const len1 = WASM_VECTOR_LEN;
			getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
			getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
		},
		__wbg___wbindgen_in_aca499c5de7ff5e5: (arg0: any, arg1: any) => arg0 in arg1,
		__wbg___wbindgen_is_bigint_2f76dc55065b4273: (arg0: unknown) => typeof arg0 === "bigint",
		__wbg___wbindgen_is_function_1ff95bcc5517c252: (arg0: unknown) => typeof arg0 === "function",
		__wbg___wbindgen_is_null_ea9085d691f535d3: (arg0: unknown) => arg0 === null,
		__wbg___wbindgen_is_object_a27215656b807791: (val: unknown) =>
			typeof val === "object" && val !== null,
		__wbg___wbindgen_is_undefined_c05833b95a3cf397: (arg0: unknown) => arg0 === undefined,
		__wbg___wbindgen_jsval_eq_e659fcf7b0e32763: (arg0: unknown, arg1: unknown) => arg0 === arg1,
		__wbg___wbindgen_jsval_loose_eq_db4c3b15f63fc170: (arg0: any, arg1: any) =>
			// biome-ignore lint/suspicious/noDoubleEquals: wasm-bindgen loose equality
			arg0 == arg1,
		__wbg___wbindgen_number_get_394265ed1e1b84ee: (arg0: number, arg1: unknown) => {
			const obj = arg1;
			const ret = typeof obj === "number" ? obj : undefined;
			getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
			getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret) ? 1 : 0, true);
		},
		__wbg___wbindgen_string_get_b0ca35b86a603356: (arg0: number, arg1: unknown) => {
			const obj = arg1;
			const ret = typeof obj === "string" ? obj : undefined;
			const ptr1 = isLikeNone(ret)
				? 0
				: passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
			const len1 = WASM_VECTOR_LEN;
			getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
			getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
		},
		__wbg___wbindgen_throw_344f42d3211c4765: (arg0: number, arg1: number) => {
			throw new Error(getStringFromWasm0(arg0, arg1));
		},
		__wbg_call_8a2dd23819f8a60a: function () {
			return handleError((arg0: any, arg1: any) => arg0.call(arg1), arguments as any);
		},
		__wbg_done_89b2b13e91a60321: (arg0: any) => arg0.done,
		__wbg_get_c7eb1f358a7654df: function () {
			return handleError((arg0: any, arg1: any) => Reflect.get(arg0, arg1), arguments as any);
		},
		__wbg_get_unchecked_6e0ad6d2a41b06f6: (arg0: any, arg1: number) => arg0[arg1 >>> 0],
		__wbg_get_with_ref_key_6412cf3094599694: (arg0: any, arg1: any) => arg0[arg1],
		__wbg_instanceof_ArrayBuffer_4480b9e0068a8adb: (arg0: unknown) => arg0 instanceof ArrayBuffer,
		__wbg_instanceof_Uint8Array_309b927aaf7a3fc7: (arg0: unknown) => arg0 instanceof Uint8Array,
		__wbg_isArray_0677c962b281d01a: (arg0: unknown) => Array.isArray(arg0),
		__wbg_isSafeInteger_04f36e4056f1b851: (arg0: unknown) => Number.isSafeInteger(arg0),
		__wbg_iterator_6f722e4a93058b71: () => Symbol.iterator,
		__wbg_length_1f0964f4a5e2c6d8: (arg0: any) => arg0.length,
		__wbg_length_370319915dc99107: (arg0: any) => arg0.length,
		__wbg_new_cd45aabdf6073e84: (arg0: any) => new Uint8Array(arg0),
		__wbg_next_6dbf2c0ac8cde20f: (arg0: any) => arg0.next,
		__wbg_next_71f2aa1cb3d1e37e: function () {
			return handleError((arg0: any) => arg0.next(), arguments as any);
		},
		__wbg_prototypesetcall_4770620bbe4688a0: (arg0: number, arg1: number, arg2: any) => {
			Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
		},
		__wbg_value_a5d5488a9589444a: (arg0: any) => arg0.value,
		__wbindgen_cast_0000000000000001: (arg0: number, arg1: number) =>
			getStringFromWasm0(arg0, arg1),
		__wbindgen_cast_0000000000000002: (arg0: number) => BigInt.asUintN(64, BigInt(arg0)),
		__wbindgen_init_externref_table: () => {
			const table = wasm.__wbindgen_externrefs;
			const offset = table.grow(4);
			table.set(0, undefined);
			table.set(offset + 0, undefined);
			table.set(offset + 1, null);
			table.set(offset + 2, true);
			table.set(offset + 3, false);
		},
	};

	const module = new WebAssembly.Module(wasmSource as BufferSource);
	const instance = new WebAssembly.Instance(module, { "./vtracer_wasm_bg.js": import0 });
	wasm = instance.exports;
	wasm.__wbindgen_start();

	return {
		vectorizeRgba(data, width, height, options = {}) {
			let deferred3_0 = 0;
			let deferred3_1 = 0;
			try {
				const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
				const len0 = WASM_VECTOR_LEN;
				const ret = wasm.vectorize_rgba(ptr0, len0, width, height, options);
				const ptr2 = ret[0];
				const len2 = ret[1];
				if (ret[3]) {
					throw takeFromExternrefTable0(ret[2]);
				}
				deferred3_0 = ptr2;
				deferred3_1 = len2;
				return getStringFromWasm0(ptr2, len2);
			} finally {
				if (deferred3_0) {
					wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
				}
			}
		},
		vectorizeBytes(data, options = {}) {
			let deferred3_0 = 0;
			let deferred3_1 = 0;
			try {
				const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
				const len0 = WASM_VECTOR_LEN;
				const ret = wasm.vectorize_bytes(ptr0, len0, options);
				const ptr2 = ret[0];
				const len2 = ret[1];
				if (ret[3]) {
					throw takeFromExternrefTable0(ret[2]);
				}
				deferred3_0 = ptr2;
				deferred3_1 = len2;
				return getStringFromWasm0(ptr2, len2);
			} finally {
				if (deferred3_0) {
					wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
				}
			}
		},
	};
}

/**
 * Resolves high-level vectorize options into low-level VTracer options.
 */
export function buildVtracerOptions(options: VectorizeOptions = {}): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	// Preset defaults
	switch (options.preset) {
		case "logo":
			result.preset = "poster";
			result.mode = "spline";
			result.clustering = "color-cluster";
			result.hierarchical = "stacked";
			result.filterSpeckle = 4;
			result.simplify = 1.0;
			break;
		case "bw":
			result.preset = "bw";
			result.mode = "spline";
			result.clustering = "bw";
			result.adaptive = true;
			result.filterSpeckle = 2;
			result.binaryThreshold = 128;
			break;
		case "photo":
			result.preset = "photo";
			result.mode = "spline";
			result.clustering = "color-cluster";
			result.hierarchical = "stacked";
			result.filterSpeckle = 2;
			result.colorPrecision = 7;
			break;
		case "poster":
			result.preset = "poster";
			result.mode = "polygon";
			result.clustering = "color-cluster";
			result.filterSpeckle = 8;
			break;
		case "pixel":
			result.mode = "pixel";
			result.clustering = "color-cluster";
			result.filterSpeckle = 0;
			break;
	}

	// Explicit overrides
	if (options.mode) result.mode = options.mode;
	if (options.clustering) result.clustering = options.clustering;
	if (options.hierarchical) result.hierarchical = options.hierarchical;
	if (options.filterSpeckle !== undefined) result.filterSpeckle = options.filterSpeckle;
	if (options.colorPrecision !== undefined) result.colorPrecision = options.colorPrecision;
	if (options.layerDifference !== undefined) result.layerDifference = options.layerDifference;
	if (options.cornerThreshold !== undefined) result.cornerThreshold = options.cornerThreshold;
	if (options.lengthThreshold !== undefined) result.lengthThreshold = options.lengthThreshold;
	if (options.maxIterations !== undefined) result.maxIterations = options.maxIterations;
	if (options.spliceThreshold !== undefined) result.spliceThreshold = options.spliceThreshold;
	if (options.simplify !== undefined) result.simplify = options.simplify;
	if (options.pathPrecision !== undefined) result.pathPrecision = options.pathPrecision;
	if (options.maxColors !== undefined) result.maxColors = options.maxColors;
	if (options.optimize !== undefined) result.optimize = options.optimize;
	if (options.binaryThreshold !== undefined) result.binaryThreshold = options.binaryThreshold;
	if (options.adaptive !== undefined) result.adaptive = options.adaptive;
	if (options.adaptiveWindow !== undefined) result.adaptiveWindow = options.adaptiveWindow;
	if (options.adaptiveT !== undefined) result.adaptiveT = options.adaptiveT;

	return result;
}

/**
 * Extract SVG metrics (path count, unique colors, width, height)
 */
export function inspectSvg(svg: string): {
	width: number;
	height: number;
	pathsCount: number;
	colorsCount: number;
} {
	const pathsMatch = svg.match(/<path\b/gi);
	const pathsCount = pathsMatch ? pathsMatch.length : 0;

	const colors = new Set<string>();
	const fillMatches = svg.matchAll(/fill="([^"]+)"/gi);
	for (const m of fillMatches) {
		if (m[1] && m[1] !== "none") colors.add(m[1].toLowerCase());
	}

	let width = 0;
	let height = 0;
	const widthMatch = svg.match(/width="([0-9.]+)"/i);
	const heightMatch = svg.match(/height="([0-9.]+)"/i);
	if (widthMatch?.[1]) width = parseFloat(widthMatch[1]);
	if (heightMatch?.[1]) height = parseFloat(heightMatch[1]);

	if (!width || !height) {
		const viewBoxMatch = svg.match(/viewBox="([0-9.\s-]+)"/i);
		if (viewBoxMatch?.[1]) {
			const parts = viewBoxMatch[1].trim().split(/[\s,]+/);
			if (parts.length >= 4) {
				width = parseFloat(parts[2] || "0");
				height = parseFloat(parts[3] || "0");
			}
		}
	}

	return {
		width,
		height,
		pathsCount,
		colorsCount: colors.size,
	};
}

/**
 * Vectorize raw RGBA pixel data into clean SVG markup.
 */
export async function vectorizeRgba(
	rgba: Uint8Array,
	width: number,
	height: number,
	options: VectorizeOptions = {},
	wasmSource?: string | ArrayBuffer | Uint8Array,
): Promise<VectorizeResult> {
	checkAbort(options.signal);
	const start = performance.now();
	const engine = await initVtracer(wasmSource);
	checkAbort(options.signal);

	const vtracerOptions = buildVtracerOptions(options);
	const svg = engine.vectorizeRgba(rgba, width, height, vtracerOptions);
	const durationMs = Math.round(performance.now() - start);

	const metrics = inspectSvg(svg);
	return {
		svg,
		width: metrics.width || width,
		height: metrics.height || height,
		pathsCount: metrics.pathsCount,
		colorsCount: metrics.colorsCount,
		durationMs,
	};
}

/**
 * Vectorize encoded image bytes (PNG, JPEG, WebP) into clean SVG markup.
 */
export async function vectorizeBytes(
	bytes: Uint8Array,
	options: VectorizeOptions = {},
	wasmSource?: string | ArrayBuffer | Uint8Array,
): Promise<VectorizeResult> {
	checkAbort(options.signal);
	const start = performance.now();
	const engine = await initVtracer(wasmSource);
	checkAbort(options.signal);

	const vtracerOptions = buildVtracerOptions(options);
	const svg = engine.vectorizeBytes(bytes, vtracerOptions);
	const durationMs = Math.round(performance.now() - start);

	const metrics = inspectSvg(svg);
	return {
		svg,
		width: metrics.width,
		height: metrics.height,
		pathsCount: metrics.pathsCount,
		colorsCount: metrics.colorsCount,
		durationMs,
	};
}
