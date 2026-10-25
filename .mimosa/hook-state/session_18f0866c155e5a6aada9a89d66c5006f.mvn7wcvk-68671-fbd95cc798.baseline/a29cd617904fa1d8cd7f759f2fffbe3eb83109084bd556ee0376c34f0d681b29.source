/**
 * Framework-free WebGL controller for the landing-hero hologram.
 *
 * The module never touches `window`/`document` at import time, so the React
 * overlay can import it lazily on the client without breaking SSR.
 */

import {
	clamp01,
	drawingBufferSize,
	type HologramPalette,
	preferredDpr,
	resolveHologramPalette,
} from "./hologram-math";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./hologram-shaders";

type GL = WebGLRenderingContext | WebGL2RenderingContext;

export interface HologramScene {
	start(): void;
	stop(): void;
	dispose(): void;
	resize(cssWidth: number, cssHeight: number): void;
	setScroll(progress: number): void;
	setPointer(x: number, y: number): void;
	setPalette(palette: HologramPalette): void;
	renderOnce(): void;
}

export interface HologramSceneOptions {
	/** Touch devices render a lighter variant and a smaller buffer. */
	coarsePointer?: boolean;
	/** Optional override for the drawing-buffer pixel budget. */
	maxPixels?: number;
	/** Mirrors canvas visibility for context loss/restore. */
	onActiveChange?: (active: boolean) => void;
}

interface Uniforms {
	resolution: WebGLUniformLocation | null;
	time: WebGLUniformLocation | null;
	scroll: WebGLUniformLocation | null;
	pointer: WebGLUniformLocation | null;
	primary: WebGLUniformLocation | null;
	secondary: WebGLUniformLocation | null;
	accent: WebGLUniformLocation | null;
	background: WebGLUniformLocation | null;
	intensity: WebGLUniformLocation | null;
	quality: WebGLUniformLocation | null;
	light: WebGLUniformLocation | null;
}

interface Build {
	program: WebGLProgram;
	buffer: WebGLBuffer;
	uniforms: Uniforms;
}

const DEFAULT_PALETTE = resolveHologramPalette(() => "", false);
const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
	alpha: false,
	antialias: false,
	depth: false,
	stencil: false,
	powerPreference: "low-power",
	premultipliedAlpha: true,
};

function warn(message: string) {
	if (import.meta.env.DEV) console.warn(`[hero-hologram] ${message}`);
}

function compile(gl: GL, type: number, source: string): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		warn(`shader compile failed: ${gl.getShaderInfoLog(shader) ?? "unknown error"}`);
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function build(gl: GL): Build | null {
	const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
	if (!vertex || !fragment) {
		if (vertex) gl.deleteShader(vertex);
		if (fragment) gl.deleteShader(fragment);
		return null;
	}

	const program = gl.createProgram();
	if (!program) {
		gl.deleteShader(vertex);
		gl.deleteShader(fragment);
		return null;
	}
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		warn(`program link failed: ${gl.getProgramInfoLog(program) ?? "unknown error"}`);
		gl.deleteProgram(program);
		return null;
	}

	const buffer = gl.createBuffer();
	if (!buffer) {
		gl.deleteProgram(program);
		return null;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

	const position = gl.getAttribLocation(program, "aPosition");
	if (position < 0) {
		gl.deleteBuffer(buffer);
		gl.deleteProgram(program);
		return null;
	}
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
	// Uniform locations are only valid while their program is in use.
	// biome-ignore lint/correctness/useHookAtTopLevel: WebGL API, not a React hook
	gl.useProgram(program);

	return {
		program,
		buffer,
		uniforms: {
			resolution: gl.getUniformLocation(program, "uResolution"),
			time: gl.getUniformLocation(program, "uTime"),
			scroll: gl.getUniformLocation(program, "uScroll"),
			pointer: gl.getUniformLocation(program, "uPointer"),
			primary: gl.getUniformLocation(program, "uColorA"),
			secondary: gl.getUniformLocation(program, "uColorB"),
			accent: gl.getUniformLocation(program, "uColorC"),
			background: gl.getUniformLocation(program, "uBackground"),
			intensity: gl.getUniformLocation(program, "uIntensity"),
			quality: gl.getUniformLocation(program, "uQuality"),
			light: gl.getUniformLocation(program, "uLight"),
		},
	};
}

export function createHologramScene(
	canvas: HTMLCanvasElement,
	options: HologramSceneOptions = {},
): HologramScene | null {
	const gl =
		canvas.getContext("webgl2", CONTEXT_ATTRIBUTES) ??
		canvas.getContext("webgl", CONTEXT_ATTRIBUTES);
	if (!gl) return null;

	const initial = build(gl);
	if (!initial) return null;
	let current: Build = initial;

	const quality = options.coarsePointer ? 0 : 1;
	let palette: HologramPalette = DEFAULT_PALETTE;
	let running = false;
	let contextLost = false;
	let wasRunning = false;
	let raf = 0;
	let last = 0;
	let time = 0;
	let scroll = 0;
	let scrollTarget = 0;
	let pointerX = 0;
	let pointerY = 0;
	let pointerTargetX = 0;
	let pointerTargetY = 0;

	const uploadPalette = () => {
		const { primary, secondary, accent, background, intensity, light } = palette;
		gl.uniform3f(current.uniforms.primary, primary[0], primary[1], primary[2]);
		gl.uniform3f(current.uniforms.secondary, secondary[0], secondary[1], secondary[2]);
		gl.uniform3f(current.uniforms.accent, accent[0], accent[1], accent[2]);
		gl.uniform3f(current.uniforms.background, background[0], background[1], background[2]);
		gl.uniform1f(current.uniforms.intensity, intensity);
		gl.uniform1f(current.uniforms.quality, quality);
		gl.uniform1f(current.uniforms.light, light ? 1 : 0);
	};

	const draw = () => {
		gl.uniform1f(current.uniforms.time, time);
		gl.uniform1f(current.uniforms.scroll, scroll);
		gl.uniform2f(current.uniforms.pointer, pointerX, pointerY);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};

	const frame: FrameRequestCallback = (now) => {
		if (!running) {
			raf = 0;
			return;
		}
		const dt = last === 0 ? 1 / 60 : Math.min((now - last) / 1000, 0.05);
		last = now;
		time += dt;
		const easing = 1 - Math.exp(-8 * dt);
		scroll += (scrollTarget - scroll) * easing;
		pointerX += (pointerTargetX - pointerX) * easing;
		pointerY += (pointerTargetY - pointerY) * easing;
		if (!gl.isContextLost()) draw();
		raf = requestAnimationFrame(frame);
	};

	const start = () => {
		if (running || contextLost) return;
		running = true;
		last = 0;
		raf = requestAnimationFrame(frame);
	};

	const stop = () => {
		running = false;
		if (raf !== 0) cancelAnimationFrame(raf);
		raf = 0;
	};

	const resize = (cssWidth: number, cssHeight: number) => {
		if (!Number.isFinite(cssWidth) || !Number.isFinite(cssHeight)) return;
		if (cssWidth <= 0 || cssHeight <= 0) return;
		const dpr = preferredDpr(window.devicePixelRatio || 1, options.coarsePointer ?? false);
		const size = drawingBufferSize(cssWidth, cssHeight, dpr, options.maxPixels);
		if (canvas.width !== size.width || canvas.height !== size.height) {
			canvas.width = size.width;
			canvas.height = size.height;
		}
		gl.viewport(0, 0, size.width, size.height);
		gl.uniform2f(current.uniforms.resolution, size.width, size.height);
	};

	const setPalette = (next: HologramPalette) => {
		palette = next;
		uploadPalette();
	};

	const setScroll = (progress: number) => {
		scrollTarget = Number.isFinite(progress) ? clamp01(progress) : 0;
	};

	const setPointer = (x: number, y: number) => {
		pointerTargetX = Number.isFinite(x) ? Math.min(1, Math.max(-1, x)) : 0;
		pointerTargetY = Number.isFinite(y) ? Math.min(1, Math.max(-1, y)) : 0;
	};

	const rebuild = (): boolean => {
		const next = build(gl);
		if (!next) return false;
		gl.deleteBuffer(current.buffer);
		gl.deleteProgram(current.program);
		current = next;
		// biome-ignore lint/correctness/useHookAtTopLevel: WebGL API, not a React hook
		gl.useProgram(current.program);
		uploadPalette();
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.uniform2f(current.uniforms.resolution, canvas.width, canvas.height);
		return true;
	};

	const onContextLost = (event: Event) => {
		event.preventDefault();
		wasRunning = running;
		stop();
		contextLost = true;
		options.onActiveChange?.(false);
	};

	const onContextRestored = () => {
		if (!rebuild()) {
			contextLost = true;
			return;
		}
		contextLost = false;
		options.onActiveChange?.(true);
		if (wasRunning) start();
	};

	canvas.addEventListener("webglcontextlost", onContextLost);
	canvas.addEventListener("webglcontextrestored", onContextRestored);

	uploadPalette();

	return {
		start,
		stop,
		resize,
		setScroll,
		setPointer,
		setPalette,
		renderOnce: () => {
			if (!contextLost && !gl.isContextLost()) draw();
		},
		dispose: () => {
			stop();
			canvas.removeEventListener("webglcontextlost", onContextLost);
			canvas.removeEventListener("webglcontextrestored", onContextRestored);
			// Do not call WEBGL_lose_context here: the component may boot again on
			// the same canvas (reduced-motion toggle) and a lost context cannot compile.
			gl.deleteBuffer(current.buffer);
			gl.deleteProgram(current.program);
		},
	};
}
