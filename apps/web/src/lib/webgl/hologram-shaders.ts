/**
 * GLSL ES 1.00 sources for the landing-hero hologram.
 *
 * Deliberately WebGL1-compatible so the same program runs on both context
 * types. One fullscreen triangle, no textures, no derivatives, at most two
 * bounded loops: the entire scene is procedural.
 */

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;

void main() {
	gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform float uScroll;
uniform vec2 uPointer;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uBackground;
uniform float uIntensity;
uniform float uQuality;
uniform float uLight;

float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash21(i);
	float b = hash21(i + vec2(1.0, 0.0));
	float c = hash21(i + vec2(0.0, 1.0));
	float d = hash21(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

/** Anti-aliased line mask on an integer lattice. */
float gridMask(vec2 coord, float width) {
	vec2 d = abs(fract(coord - 0.5) - 0.5);
	return 1.0 - smoothstep(0.0, width, min(d.x, d.y));
}

/** One translucent ribbon of the aurora; index shifts frequency and height. */
float auroraBand(float x, float y, float index, float drift) {
	float freq = 1.15 + index * 0.65;
	float wave = sin(x * freq + drift * (1.0 + index * 0.35) + index * 1.7);
	wave += 0.45 * sin(x * freq * 2.3 - drift * 1.6 + index * 3.4);
	float bandY = 0.14 + index * 0.11 + wave * (0.05 + index * 0.012);
	return exp(-abs(y - bandY) * (17.0 - index * 3.5)) * (0.42 - index * 0.09);
}

void main() {
	vec2 frag = gl_FragCoord.xy / max(uResolution, vec2(1.0));
	float aspect = uResolution.x / max(uResolution.y, 1.0);
	vec2 p = (frag * 2.0 - 1.0) * vec2(aspect, 1.0);

	float scroll = clamp(uScroll, 0.0, 1.0);
	vec2 pointer = clamp(uPointer, -1.0, 1.0);
	float quality = step(0.5, uQuality);

	/* Aurora ribbons: slow ambient drift plus a slower scroll parallax. */
	float drift = uTime * 0.055 + scroll * 0.35;
	float auroraY = p.y + scroll * 0.9;
	float aurora = auroraBand(p.x, auroraY, 0.0, drift);
	aurora += auroraBand(p.x, auroraY, 1.0, drift);
	if (quality > 0.5) aurora += auroraBand(p.x, auroraY, 2.0, drift);
	float haze = valueNoise(vec2(p.x * 1.7 + drift, p.y * 2.4 - drift * 0.6));
	aurora += haze * smoothstep(-0.4, 0.55, auroraY) * 0.28;

	vec3 auroraColor = mix(uColorA, uColorB, smoothstep(-0.8, 0.8, p.x + pointer.x * 0.06));
	vec3 col = uBackground + auroraColor * aurora * 0.22 * uIntensity;

	/* Perspective grid floor, projected analytically below the horizon. */
	float horizon = -0.18 - scroll * 0.85 + pointer.y * 0.02;
	float below = horizon - p.y;
	float floorFade = smoothstep(0.0, 0.035, below);
	float depth = 1.0 / max(below, 0.02);
	vec2 plane = vec2(
		p.x * depth * 0.78 + pointer.x * 0.35,
		depth * 1.45 + scroll * 2.6
	);
	float minorFade = 1.0 - smoothstep(2.5, 9.0, depth);
	float majorFade = 1.0 - smoothstep(6.0, 15.0, depth);
	float minor = gridMask(plane, 0.03);
	float major = gridMask(plane * 0.25, 0.008);
	vec3 gridColor = mix(uColorB, uColorA, smoothstep(0.02, 0.32, below));
	col += gridColor * (minor * 0.07 * minorFade + major * 0.3 * majorFade) * floorFade * uIntensity;

	/* Glowing horizon and a soft pool of light under it. */
	col += mix(uColorA, uColorC, 0.45) * exp(-abs(below) * 22.0) * 0.14 * uIntensity;
	col += mix(uColorC, uBackground, 0.35) * exp(-max(below, 0.0) * 7.0) * 0.04 * uIntensity;

	/* Holographic scan bar plus fine scanlines. */
	float sweep = exp(-abs(fract(uTime * 0.04 + scroll * 0.25) - frag.y) * 90.0);
	col += mix(uColorB, uColorC, 0.5) * sweep * 0.05 * uIntensity;
	float scan = 0.5 + 0.5 * sin(frag.y * uResolution.y * 1.6 + uTime * 1.4);
	col *= 1.0 - scan * 0.01 * uIntensity;

	if (quality > 0.5) {
		float grain = hash21(gl_FragCoord.xy + fract(uTime) * 91.7);
		col += (grain - 0.5) * 0.014 * uIntensity;
	}

	/* Quiet the busiest detail right behind the headline and copy. */
	vec2 safe = (p - vec2(0.0, 0.3)) * vec2(0.62, 0.95);
	float protect = 1.0 - 0.6 * exp(-dot(safe, safe) * 2.4);
	col = mix(uBackground, col, protect);

	/* Tone-map only the added glow so the base background stays exact. Light
	   themes composite the field as a neutral tint: additive light cannot show
	   on white, and a grayscale field has no hue to preserve. */
	vec3 glow = max(col - uBackground, 0.0);
	vec3 mapped = vec3(1.0) - exp(-glow * 1.55);
	float peak = max(max(mapped.r, mapped.g), mapped.b);
	vec3 tint = mix(uBackground, uColorA, clamp(peak * 1.6, 0.0, 1.0) * 0.7);
	col = mix(uBackground + mapped, tint, uLight);

	/* Fade into the page background at the top, bottom and sides. */
	float edgeX = smoothstep(0.0, 0.14, frag.x) * (1.0 - smoothstep(0.86, 1.0, frag.x));
	float edgeY = smoothstep(0.0, 0.13, frag.y) * (1.0 - smoothstep(0.72, 1.0, frag.y));
	col = mix(uBackground, col, edgeX * edgeY);

	gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
