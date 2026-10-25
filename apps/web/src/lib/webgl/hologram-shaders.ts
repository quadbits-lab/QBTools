/**
 * GLSL ES 1.00 sources for the landing-hero 3D wireframe terrain & perspective
 * enclosure.
 *
 * Deliberately WebGL1-compatible so the same program runs on both context
 * types. Combines an analytical 3D wireframe room enclosure, parallax star/dust
 * specks in the void, and a multi-crossing 3D undulating wireframe terrain mesh
 * with glowing vertex nodes and interactive pointer wave physics.
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

vec2 hash22(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.xx + p3.yz) * p3.zy);
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

/**
 * 3D undulating terrain heightfield y = f(x, z) + interactive cursor wave.
 * Adapts peak placement and elevation for portrait/mobile aspect ratios.
 * Returns vec2(height, cursorActivity).
 */
vec2 terrainField(vec2 xz, vec2 ptrXZ, float time, float portrait) {
	/* Flowing multi-octave organic hills with 2x wave ridge density:
	   taller sculpted peaks toward the right and left flanks, rolling waves
	   across the foreground. */
	vec2 q = xz * vec2(1.55, 1.48) + vec2(-time * 0.24, time * 0.18);
	float w1 = sin(q.x * 1.85 + cos(q.y * 1.75 + time * 0.26));
	float w2 = cos(q.x * 2.95 - q.y * 2.45 - time * 0.35) * 0.54;
	float w3 = sin((q.x + q.y) * 4.2 + time * 0.5) * 0.28;
	float n = (valueNoise(q * 2.25) - 0.5) * 0.78;

	/* Pull the sculpted flank peaks inward on portrait screens so both ridges
	   frame the mobile viewport instead of sitting off-screen. */
	float peakX = mix(1.55, 0.92, portrait);
	float rightPeak = exp(-pow(xz.x - peakX, 2.0) * 0.65 - pow(xz.y - 0.15, 2.0) * 0.38) * 0.72;
	float leftPeak = exp(-pow(xz.x + peakX * 1.05, 2.0) * 0.8 - pow(xz.y + 0.35, 2.0) * 0.45) * 0.52;
	float flankLift = smoothstep(0.25, mix(2.6, 1.45, portrait), abs(xz.x)) * 0.34;

	/* Interactive pointer / autonomous roving wave: lifts a smooth 3D peak + ripple. */
	float dPtr = length(xz - ptrXZ);
	float cursorPeak = exp(-dPtr * dPtr * 0.95) * 0.46;
	float cursorRipple = exp(-dPtr * 0.8) * sin(dPtr * 6.5 - time * 4.8) * 0.1;
	float activity = clamp(exp(-dPtr * dPtr * 0.55) + exp(-abs(dPtr - 1.3) * 2.2) * 0.35, 0.0, 1.0);

	/* Lift base elevation slightly on portrait screens so the wave sits right
	   behind the search bar and popular pills. */
	float baseH = mix(-1.10, -0.78, portrait);
	float h = baseH
		+ (w1 * 0.26 + w2 * 0.20 + w3 * 0.12 + n * 0.24) * (0.58 + flankLift)
		+ rightPeak
		+ leftPeak
		+ cursorPeak
		+ cursorRipple;

	return vec2(h, activity);
}

/**
 * Sparse floating dust / star specks in the dark central void.
 */
float starParticles(vec2 uv, float time, vec2 pointer, float quality) {
	float acc = 0.0;
	for (int layer = 0; layer < 2; layer++) {
		if (quality > 0.5 || layer == 0) {
			float fl = float(layer);
			float scale = 18.0 + fl * 14.0;
			vec2 drift = vec2(time * (0.04 + fl * 0.03), -time * (0.025 + fl * 0.02));
			vec2 p = uv * scale + drift + pointer * (0.35 + fl * 0.25);
			vec2 cell = floor(p);
			vec2 local = fract(p) - 0.5;
			vec2 rnd = hash22(cell + fl * 73.1);
			vec2 offset = (rnd - 0.5) * 0.72;
			float d = length(local - offset);
			float radius = 0.028 + rnd.x * 0.035;
			float twinkle = 0.55 + 0.45 * sin(time * (1.2 + rnd.y * 2.5) + rnd.x * 6.283);
			float speck = (1.0 - smoothstep(radius * 0.3, radius, d)) * step(0.62, rnd.y);
			acc += speck * twinkle * (0.38 - fl * 0.12);
		}
	}
	return acc;
}

/**
 * Analytical 3D perspective wireframe room enclosure (left wall, right wall,
 * top ceiling, and inner frame edges) with an ambient luminance blend.
 * Returns vec2(wireframeLine, ambientGlow).
 */
vec2 roomWireframe(vec3 ro, vec3 rd, float xScale, float portrait, vec2 pointer, float time) {
	/* Match horizontal wall distance to ceiling height in camera space so the
	   left, right, and top perspective grid walls meet cleanly at the corners
	   and extend inward to frame the hero on both sides. */
	float xWall = xScale * mix(1.12, 1.05, portrait);
	float yCeil = ro.y + mix(1.06, 0.98, portrait);
	float yFloor = ro.y - mix(1.42, 1.28, portrait);
	float zMin = -2.25;
	float zMax = mix(0.48, 0.55, portrait);

	float lineAcc = 0.0;
	float ambientAcc = 0.0;

	/* Left & Right perspective grid walls (x = -xWall and x = +xWall). */
	if (abs(rd.x) > 0.0001) {
		float side = sign(rd.x);
		float tWall = (side * xWall - ro.x) / rd.x;
		if (tWall > 0.0) {
			vec3 pos = ro + rd * tWall;
			if (pos.y <= yCeil && pos.y >= yFloor && pos.z >= zMin && pos.z <= zMax) {
				vec2 wallUV = vec2(pos.z * 3.8, pos.y * 4.0);
				float g = gridMask(wallUV, 0.018);
				/* Inner back, top, and bottom perspective rails of the side wall. */
				float railTop = 1.0 - smoothstep(0.0, 0.018, abs(pos.y - yCeil));
				float railBottom = 1.0 - smoothstep(0.0, 0.018, abs(pos.y - yFloor));
				float railBack = 1.0 - smoothstep(0.0, 0.022, abs(pos.z - zMax));
				float rails = max(max(railTop, railBottom), railBack);

				/* Smooth ambient blend from outer edge into the inner frame and floor. */
				float depthFade = smoothstep(zMax + 0.1, zMin + 0.3, pos.z);
				float innerSoft = smoothstep(zMax + 0.04, zMax - 0.22, pos.z);
				float bottomFade = smoothstep(yFloor - 0.05, yFloor + 0.35, pos.y);
				float ptrHighlight = 0.78 + 0.22 * clamp(side * pointer.x, 0.0, 1.0);

				float mask = bottomFade * ptrHighlight;
				lineAcc = max(
					lineAcc,
					(g * (0.42 + 0.45 * depthFade) * innerSoft + rails * 0.72) * mask
				);
				ambientAcc = max(ambientAcc, (0.25 + 0.75 * depthFade) * innerSoft * bottomFade * 0.08);
			}
		}
	}

	/* Top perspective ceiling grid (y = +yCeil). */
	if (rd.y > 0.0001) {
		float tCeil = (yCeil - ro.y) / rd.y;
		if (tCeil > 0.0) {
			vec3 pos = ro + rd * tCeil;
			if (abs(pos.x) <= xWall && pos.z >= zMin && pos.z <= zMax) {
				vec2 ceilUV = vec2(pos.x * 3.6, pos.z * 3.8);
				float g = gridMask(ceilUV, 0.018);
				float railBack = 1.0 - smoothstep(0.0, 0.022, abs(pos.z - zMax));
				float railSide = 1.0 - smoothstep(0.0, 0.018, abs(abs(pos.x) - xWall));

				float depthFade = smoothstep(zMax + 0.1, zMin + 0.3, pos.z);
				float innerSoft = smoothstep(zMax + 0.04, zMax - 0.22, pos.z);
				float ptrHighlight = 0.78 + 0.22 * clamp(pointer.y, 0.0, 1.0);

				lineAcc = max(
					lineAcc,
					(g * (0.42 + 0.45 * depthFade) * innerSoft + max(railBack, railSide) * 0.72) * ptrHighlight
				);
				ambientAcc = max(ambientAcc, (0.25 + 0.75 * depthFade) * innerSoft * 0.07);
			}
		}
	}

	/* Subtle travelling ambient wave along the room depth (+15% opacity boost). */
	float zWave = 0.88 + 0.12 * sin(time * 0.9);
	return vec2(lineAcc * 0.125 * zWave, ambientAcc * 0.25 * zWave);
}

/**
 * Evaluate the wireframe lines, glowing vertex dots, and data pulses at a
 * 3D surface hit point on the undulating terrain mesh.
 */
vec3 shadeTerrainHit(vec3 hitPos, float t, float act, float crossingIndex, float time) {
	float gridScale = 13.6;
	vec2 gCoord = hitPos.xz * gridScale;

	/* Local cell coordinates for wireframe lines and vertex intersections. */
	vec2 dCell = abs(fract(gCoord - 0.5) - 0.5);
	float distToLine = min(dCell.x, dCell.y);
	float distToVertex = length(dCell);

	/* Perspective-scaled anti-aliased line width and vertex dot radius for 2x dense mesh. */
	float lw = clamp(0.028 + t * 0.005, 0.026, 0.056);
	float wire = 1.0 - smoothstep(0.0, lw, distToLine);
	float wireGlow = exp(-distToLine * 20.0) * 0.12;

	/* Crisp glowing vertex dot at every (x, z) grid intersection. */
	float dotRadius = clamp(0.085 + t * 0.006 + act * 0.024, 0.08, 0.135);
	float vertexCore = 1.0 - smoothstep(dotRadius * 0.35, dotRadius, distToVertex);
	float vertexHalo = exp(-distToVertex * 10.5) * (0.22 + act * 0.32);

	/* Travelling data pulses along the wireframe tracks. */
	float pulseX = exp(-abs(fract(hitPos.x * 0.45 - time * 0.24) - 0.5) * 16.0) * step(dCell.y, lw * 1.4);
	float pulseZ = exp(-abs(fract(hitPos.z * 0.45 + time * 0.20) - 0.5) * 16.0) * step(dCell.x, lw * 1.4);
	float dataPulse = max(pulseX, pulseZ);

	/* Distance and edge attenuation in 3D world space. */
	float zFade = smoothstep(3.2, 0.5, hitPos.z) * smoothstep(-2.35, -1.55, hitPos.z);
	float xFade = 1.0 - smoothstep(2.3, 3.3, abs(hitPos.x));
	/* Secondary (back-slope) crossings are slightly dimmer for natural depth. */
	float layerWeight = (crossingIndex < 0.5 ? 1.0 : 0.52) * zFade * xFade;

	/* Strictly grayscale monochrome wireframe + bright white/silver vertex nodes. */
	vec3 lineColor = mix(uColorC, uColorA, clamp(0.35 + act * 0.55 + dataPulse * 0.45, 0.0, 1.0));
	vec3 dotColor = mix(uColorB, uColorA, clamp(0.65 + act * 0.35, 0.0, 1.0));

	vec3 contrib = lineColor * (wire * 0.56 + wireGlow + dataPulse * 0.36)
		+ dotColor * (vertexCore * 1.18 + vertexHalo);

	return contrib * layerWeight;
}

void main() {
	vec2 frag = gl_FragCoord.xy / max(uResolution, vec2(1.0));
	float aspect = uResolution.x / max(uResolution.y, 1.0);
	/* Portrait factor (0 on desktop landscape, up to 1 on narrow mobile viewports). */
	float portrait = clamp((1.05 - aspect) * 1.35, 0.0, 1.0);
	/* Widen effective horizontal FOV on mobile portrait so the 3D terrain waves
	   and perspective walls frame the screen instead of clipping off the sides. */
	float xScale = max(aspect, mix(aspect, 0.82, portrait));
	vec2 p = (frag * 2.0 - 1.0) * vec2(xScale, 1.0);

	float scroll = clamp(uScroll, 0.0, 1.0);
	float quality = step(0.5, uQuality);

	/* Blend user pointer with a gentle autonomous roving wave on mobile/idle
	   so touch devices always exhibit dynamic 3D wave motion and parallax. */
	vec2 autoPointer = vec2(sin(uTime * 0.55) * 0.55, cos(uTime * 0.42) * 0.32);
	float ptrLen = length(uPointer);
	vec2 pointer = clamp(
		mix(autoPointer * (1.0 - quality * 0.7), uPointer, clamp(ptrLen * 2.5 + quality * 0.65, 0.0, 1.0)),
		-1.0,
		1.0
	);

	/* 3D perspective camera with subtle mouse/auto parallax and scroll response. */
	vec3 ro = vec3(
		pointer.x * 0.26,
		mix(0.32, 0.20, portrait) + pointer.y * 0.12 - scroll * 0.28,
		mix(-2.55, -2.35, portrait)
	);
	vec3 rd = normalize(vec3(
		p.x * 0.88 - pointer.x * 0.06,
		p.y * 0.88 + mix(0.08, 0.22, portrait) - pointer.y * 0.05 + scroll * 0.14,
		1.65
	));

	/* Project the active pointer onto the terrain plane for interactive 3D waves. */
	vec3 rdPtr = normalize(vec3(pointer.x * xScale * 0.88, pointer.y * 0.88 + 0.12, 1.65));
	float tPtr = (mix(-0.95, -0.72, portrait) - ro.y) / min(rdPtr.y, -0.08);
	vec2 ptrXZ = clamp(ro.xz + rdPtr.xz * clamp(tPtr, 0.5, 5.5), vec2(-2.6), vec2(2.6));

	/* Base color is strictly the body background token (--background). */
	vec3 col = uBackground;

	/* 1. Perspective 3D wireframe room enclosure (top & side walls) with ambient blend. */
	vec2 room = roomWireframe(ro, rd, xScale, portrait, pointer, uTime);
	vec3 wallTone = mix(uColorC, uColorA, clamp(0.35 + frag.y * 0.45, 0.0, 1.0));
	col += (wallTone * room.x + mix(uColorC, uColorB, 0.5) * room.y) * uIntensity;

	/* 2. Sparse drifting micro-particles in the open void (1 layer on mobile, 2 on desktop). */
	float specks = starParticles(p, uTime, pointer, quality);
	float speckMask = smoothstep(-0.35, 0.25, p.y);
	col += uColorB * specks * speckMask * 0.45 * uIntensity;

	/* 3. Raymarch the 3D undulating wireframe terrain with translucent multi-ridge crossings. */
	float tMin = 0.65;
	float tMax = 5.6;
	vec3 accumTerrain = vec3(0.0);
	float crossings = 0.0;

	/* Only march rays that can intersect the lower terrain volume. */
	if (rd.y < 0.34) {
		float dt = (tMax - tMin) / 48.0;
		float t = tMin;
		vec3 prevPos = ro + rd * t;
		vec2 prevField = terrainField(prevPos.xz, ptrXZ, uTime, portrait);
		float prevDiff = prevPos.y - prevField.x;

		for (int i = 0; i < 48; i++) {
			if (crossings < 3.0 && (quality > 0.5 || i < 32)) {
				t += dt;
				vec3 pos = ro + rd * t;
				vec2 field = terrainField(pos.xz, ptrXZ, uTime, portrait);
				float diff = pos.y - field.x;

				/* Detect surface crossing (front slope or secondary ridge behind it). */
				if ((prevDiff > 0.0 && diff <= 0.0) || (prevDiff < 0.0 && diff >= 0.0)) {
					float frac = clamp(prevDiff / (prevDiff - diff), 0.0, 1.0);
					float hitT = (t - dt) + dt * frac;
					vec3 hitPos = ro + rd * hitT;
					float hitAct = mix(prevField.y, field.y, frac);

					accumTerrain += shadeTerrainHit(hitPos, hitT, hitAct, crossings, uTime);
					crossings += 1.0;
				}

				prevPos = pos;
				prevField = field;
				prevDiff = diff;
			}
		}
	}

	col += accumTerrain * 0.70 * uIntensity;

	/* Quiet the central typography stage so the hero headline and subtitle have
	   crisp contrast against pure --background. */
	vec2 safe = (p - vec2(0.0, 0.22)) * vec2(0.62, 1.15);
	float protect = 1.0 - 0.65 * exp(-dot(safe, safe) * 2.4);
	col = mix(uBackground, col, protect);

	/* Tone-map added luminance so the base background remains exact in both
	   dark and light themes (strictly neutral grayscale). */
	vec3 delta = max(col - uBackground, 0.0);
	vec3 darkCol = uBackground + (vec3(1.0) - exp(-delta * 1.55));
	float lum = dot(delta, vec3(0.299, 0.587, 0.114));
	vec3 lightTint = mix(uBackground, uColorA, clamp(lum * 2.1, 0.0, 0.34));
	col = mix(darkCol, lightTint, uLight);

	/* Seamless blend into the body background (--background) at top, bottom, and sides,
	   keeping the outer perspective grid walls visible while softly feathering the boundary. */
	float edgeX = smoothstep(0.0, 0.025, frag.x) * (1.0 - smoothstep(0.975, 1.0, frag.x));
	float edgeY = smoothstep(0.0, 0.34, frag.y) * (1.0 - smoothstep(0.96, 1.0, frag.y));
	col = mix(uBackground, col, edgeX * edgeY);

	gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
