/// <reference types="bun" />

/**
 * TanStack Start Production Server with Bun
 *
 * A high-performance production server for TanStack Start applications that
 * implements intelligent static asset loading with configurable memory management.
 *
 * Features:
 * - Hybrid loading strategy (preload small files, serve large files on-demand)
 * - Configurable file filtering with include/exclude patterns
 * - Memory-efficient response generation
 * - Production-ready caching headers
 *
 * Environment Variables:
 *
 * PORT (number)
 *   - Server port number
 *   - Default: 8310
 *
 * HOST (string)
 *   - Interface to bind. Default: 0.0.0.0 (all interfaces, needed in Docker)
 *
 * TRUST_PROXY (boolean)
 *   - Set to "true" when running behind a reverse proxy / tunnel so the client
 *     IP (used for rate limiting) is read from X-Forwarded-For. Default: false
 *
 * HSTS (boolean)
 *   - Send Strict-Transport-Security. Only enable when served over HTTPS.
 *     Default: false
 *
 * ASSET_PRELOAD_MAX_SIZE (number)
 *   - Maximum file size in bytes to preload into memory
 *   - Files larger than this will be served on-demand from disk
 *   - Default: 33554432 (32MB, so the AI runtime WASM is served gzipped)
 *   - Example: ASSET_PRELOAD_MAX_SIZE=5242880 (5MB)
 *
 * ASSET_PRELOAD_INCLUDE_PATTERNS (string)
 *   - Comma-separated list of glob patterns for files to include
 *   - If specified, only matching files are eligible for preloading
 *   - Patterns are matched against filenames only, not full paths
 *   - Example: ASSET_PRELOAD_INCLUDE_PATTERNS="*.js,*.css,*.woff2"
 *
 * ASSET_PRELOAD_EXCLUDE_PATTERNS (string)
 *   - Comma-separated list of glob patterns for files to exclude
 *   - Applied after include patterns
 *   - Patterns are matched against filenames only, not full paths
 *   - Example: ASSET_PRELOAD_EXCLUDE_PATTERNS="*.map,*.txt"
 *
 * ASSET_PRELOAD_VERBOSE_LOGGING (boolean)
 *   - Enable detailed logging of loaded and skipped files
 *   - Default: false
 *   - Set to "true" to enable verbose output
 *
 * ASSET_PRELOAD_ENABLE_ETAG (boolean)
 *   - Enable ETag generation for preloaded assets
 *   - Default: true
 *   - Set to "false" to disable ETag support
 *
 * ASSET_PRELOAD_ENABLE_GZIP (boolean)
 *   - Enable Gzip compression for eligible assets
 *   - Default: true
 *   - Set to "false" to disable Gzip compression
 *
 * ASSET_PRELOAD_GZIP_MIN_SIZE (number)
 *   - Minimum file size in bytes required for Gzip compression
 *   - Files smaller than this will not be compressed
 *   - Default: 1024 (1KB)
 *
 * ASSET_PRELOAD_GZIP_MIME_TYPES (string)
 *   - Comma-separated list of MIME types eligible for Gzip compression
 *   - Supports partial matching for types ending with "/"
 *   - Default: text/,application/javascript,application/json,application/xml,image/svg+xml,application/wasm,application/manifest+json
 *
 * Usage:
 *   bun run server.ts
 */

import path from "node:path";

// Load root .env if running locally outside Docker
const rootEnvFile = Bun.file(path.resolve(import.meta.dir, "../../.env"));
if (await rootEnvFile.exists()) {
	const content = await rootEnvFile.text();
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq > 0) {
			const k = trimmed.slice(0, eq).trim();
			const v = trimmed.slice(eq + 1).trim();
			if (process.env[k] === undefined || process.env[k] === "") {
				process.env[k] = v;
			}
		}
	}
}

// Configuration
const SERVER_PORT = Number(process.env.PORT ?? 8310);
const SERVER_HOST = process.env.HOST ?? "0.0.0.0";
const TRUST_PROXY = process.env.TRUST_PROXY === "true";
const ENABLE_HSTS = process.env.HSTS === "true";
const CLIENT_DIRECTORY = "./dist/client";
const SERVER_ENTRY_POINT = "./dist/server/server.js";

// Logging utilities for professional output
const log = {
	info: (message: string) => {
		console.log(`[INFO] ${message}`);
	},
	success: (message: string) => {
		console.log(`[SUCCESS] ${message}`);
	},
	warning: (message: string) => {
		console.log(`[WARNING] ${message}`);
	},
	error: (message: string) => {
		console.log(`[ERROR] ${message}`);
	},
	header: (message: string) => {
		console.log(`\n${message}\n`);
	},
};

// Preloading configuration from environment variables
const MAX_PRELOAD_BYTES = Number(
	process.env.ASSET_PRELOAD_MAX_SIZE ?? 32 * 1024 * 1024, // 32MB default
);

// Parse comma-separated include patterns (no defaults)
const INCLUDE_PATTERNS = (process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? "")
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean)
	.map((pattern: string) => convertGlobToRegExp(pattern));

// Parse comma-separated exclude patterns (no defaults)
const EXCLUDE_PATTERNS = (process.env.ASSET_PRELOAD_EXCLUDE_PATTERNS ?? "")
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean)
	.map((pattern: string) => convertGlobToRegExp(pattern));

// Verbose logging flag
const VERBOSE = process.env.ASSET_PRELOAD_VERBOSE_LOGGING === "true";

// Optional ETag feature
const ENABLE_ETAG = (process.env.ASSET_PRELOAD_ENABLE_ETAG ?? "true") === "true";

// Optional Gzip feature
const ENABLE_GZIP = (process.env.ASSET_PRELOAD_ENABLE_GZIP ?? "true") === "true";
const GZIP_MIN_BYTES = Number(process.env.ASSET_PRELOAD_GZIP_MIN_SIZE ?? 1024); // 1KB
const GZIP_TYPES = (
	process.env.ASSET_PRELOAD_GZIP_MIME_TYPES ??
	"text/,application/javascript,application/json,application/xml,image/svg+xml,application/wasm,application/manifest+json"
)
	.split(",")
	.map((v) => v.trim())
	.filter(Boolean);

/**
 * Security headers added to every response. The policy stays compatible with
 * AdSense, analytics and the in-browser AI model download.
 */
const SECURITY_HEADERS: Record<string, string> = {
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"X-Frame-Options": "SAMEORIGIN",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
	"Content-Security-Policy":
		"frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
	...(ENABLE_HSTS ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" } : {}),
};

/** Pages that use the camera for an on-device feature; every other page keeps it denied. */
const CAMERA_PATHS = new Set(["/tools/barcode-scanner"]);

function withSecurityHeaders(response: Response, req?: Request): Response {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!response.headers.has(name)) response.headers.set(name, value);
	}
	if (req && CAMERA_PATHS.has(new URL(req.url).pathname)) {
		const policy = SECURITY_HEADERS["Permissions-Policy"];
		if (policy) {
			response.headers.set("Permissions-Policy", policy.replace("camera=()", "camera=(self)"));
		}
	}
	return response;
}

/** Gzip dynamic HTML/JSON from the app handler (static assets are pre-gzipped). */
function compressDynamic(req: Request, response: Response): Response {
	const type = response.headers.get("content-type") ?? "";
	if (
		!ENABLE_GZIP ||
		!response.body ||
		response.headers.has("content-encoding") ||
		!req.headers.get("accept-encoding")?.includes("gzip") ||
		!/^(text\/html|application\/json|application\/xml|text\/plain)/.test(type)
	) {
		return response;
	}
	const headers = new Headers(response.headers);
	headers.set("Content-Encoding", "gzip");
	headers.delete("Content-Length");
	headers.append("Vary", "Accept-Encoding");
	return new Response(response.body.pipeThrough(new CompressionStream("gzip")), {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

/**
 * Convert a simple glob pattern to a regular expression
 * Supports * wildcard for matching any characters
 */
function convertGlobToRegExp(globPattern: string): RegExp {
	// Escape regex special chars except *, then replace * with .*
	const escapedPattern = globPattern.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&").replace(/\*/g, ".*");
	return new RegExp(`^${escapedPattern}$`, "i");
}

/**
 * Compute ETag for a given data buffer
 */
function computeEtag(data: Uint8Array): string {
	const hash = Bun.hash(data);
	return `W/"${hash.toString(16)}-${data.byteLength.toString()}"`;
}

/**
 * Metadata for preloaded static assets
 */
interface AssetMetadata {
	route: string;
	size: number;
	type: string;
}

/**
 * In-memory asset with ETag and Gzip support
 */
interface InMemoryAsset {
	raw: Uint8Array;
	gz?: Uint8Array;
	etag?: string;
	type: string;
	immutable: boolean;
	size: number;
}

/**
 * Result of static asset preloading process
 */
interface PreloadResult {
	routes: Record<string, (req: Request) => Response | Promise<Response>>;
	loaded: AssetMetadata[];
	skipped: AssetMetadata[];
}

/**
 * Check if a file is eligible for preloading based on configured patterns
 */
function isFileEligibleForPreloading(relativePath: string): boolean {
	const fileName = relativePath.split(/[/\\]/).pop() ?? relativePath;

	// If include patterns are specified, file must match at least one
	if (INCLUDE_PATTERNS.length > 0) {
		if (!INCLUDE_PATTERNS.some((pattern) => pattern.test(fileName))) {
			return false;
		}
	}

	// If exclude patterns are specified, file must not match any
	if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(fileName))) {
		return false;
	}

	return true;
}

/**
 * Check if a MIME type is compressible
 */
function isMimeTypeCompressible(mimeType: string): boolean {
	return GZIP_TYPES.some((type) =>
		type.endsWith("/") ? mimeType.startsWith(type) : mimeType === type,
	);
}

/**
 * Conditionally compress data based on size and MIME type
 */
function compressDataIfAppropriate(data: Uint8Array, mimeType: string): Uint8Array | undefined {
	if (!ENABLE_GZIP) return undefined;
	if (data.byteLength < GZIP_MIN_BYTES) return undefined;
	if (!isMimeTypeCompressible(mimeType)) return undefined;
	try {
		return Bun.gzipSync(data.buffer as ArrayBuffer);
	} catch {
		return undefined;
	}
}

/**
 * Create response handler function with ETag and Gzip support
 */
function createResponseHandler(asset: InMemoryAsset): (req: Request) => Response {
	return (req: Request) => {
		const headers: Record<string, string> = {
			"Content-Type": asset.type,
			"Cache-Control": asset.immutable
				? "public, max-age=31536000, immutable"
				: "public, max-age=3600",
		};

		if (ENABLE_ETAG && asset.etag) {
			const ifNone = req.headers.get("if-none-match");
			if (ifNone && ifNone === asset.etag) {
				return new Response(null, {
					status: 304,
					headers: { ETag: asset.etag },
				});
			}
			headers.ETag = asset.etag;
		}

		if (ENABLE_GZIP && asset.gz && req.headers.get("accept-encoding")?.includes("gzip")) {
			headers["Content-Encoding"] = "gzip";
			headers["Content-Length"] = String(asset.gz.byteLength);
			const gzCopy = new Uint8Array(asset.gz);
			headers.Vary = "Accept-Encoding";
			return new Response(gzCopy, { status: 200, headers });
		}

		headers["Content-Length"] = String(asset.raw.byteLength);
		const rawCopy = new Uint8Array(asset.raw);
		return new Response(rawCopy, { status: 200, headers });
	};
}

/**
 * Create composite glob pattern from include patterns
 */
function createCompositeGlobPattern(): Bun.Glob {
	const raw = (process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	if (raw.length === 0) return new Bun.Glob("**/*");
	if (raw.length === 1) return new Bun.Glob(raw[0] as string);
	return new Bun.Glob(`{${raw.join(",")}}`);
}

/**
 * Initialize static routes with intelligent preloading strategy
 * Small files are loaded into memory, large files are served on-demand
 */
async function initializeStaticRoutes(clientDirectory: string): Promise<PreloadResult> {
	const routes: Record<string, (req: Request) => Response | Promise<Response>> = {};
	const loaded: AssetMetadata[] = [];
	const skipped: AssetMetadata[] = [];

	log.info(`Loading static assets from ${clientDirectory}...`);
	if (VERBOSE) {
		console.log(`Max preload size: ${(MAX_PRELOAD_BYTES / 1024 / 1024).toFixed(2)} MB`);
		if (INCLUDE_PATTERNS.length > 0) {
			console.log(`Include patterns: ${process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? ""}`);
		}
		if (EXCLUDE_PATTERNS.length > 0) {
			console.log(`Exclude patterns: ${process.env.ASSET_PRELOAD_EXCLUDE_PATTERNS ?? ""}`);
		}
	}

	let totalPreloadedBytes = 0;

	try {
		const glob = createCompositeGlobPattern();
		for await (const relativePath of glob.scan({ cwd: clientDirectory })) {
			const filepath = path.join(clientDirectory, relativePath);
			const route = `/${relativePath.split(path.sep).join(path.posix.sep)}`;

			try {
				// Get file metadata
				const file = Bun.file(filepath);

				// Skip if file doesn't exist or is empty
				if (!(await file.exists()) || file.size === 0) {
					continue;
				}

				const metadata: AssetMetadata = {
					route,
					size: file.size,
					type: file.type || "application/octet-stream",
				};

				// Determine if file should be preloaded
				const matchesPattern = isFileEligibleForPreloading(relativePath);
				const withinSizeLimit = file.size <= MAX_PRELOAD_BYTES;

				if (matchesPattern && withinSizeLimit) {
					// Preload small files into memory with ETag and Gzip support
					const bytes = new Uint8Array(await file.arrayBuffer());
					const gz = compressDataIfAppropriate(bytes, metadata.type);
					const etag = ENABLE_ETAG ? computeEtag(bytes) : undefined;
					const asset: InMemoryAsset = {
						raw: bytes,
						gz,
						etag,
						type: metadata.type,
						// Only Vite's content-hashed files may be cached forever.
						immutable: route.startsWith("/assets/"),
						size: bytes.byteLength,
					};
					routes[route] = createResponseHandler(asset);

					loaded.push({ ...metadata, size: bytes.byteLength });
					totalPreloadedBytes += bytes.byteLength;
				} else {
					// Serve large or filtered files on-demand
					routes[route] = () => {
						const fileOnDemand = Bun.file(filepath);
						return new Response(fileOnDemand, {
							headers: {
								"Content-Type": metadata.type,
								"Cache-Control": "public, max-age=3600",
							},
						});
					};

					skipped.push(metadata);
				}
			} catch (error: unknown) {
				if (error instanceof Error && error.name !== "EISDIR") {
					log.error(`Failed to load ${filepath}: ${error.message}`);
				}
			}
		}

		// Show detailed file overview only when verbose mode is enabled
		if (VERBOSE && (loaded.length > 0 || skipped.length > 0)) {
			const allFiles = [...loaded, ...skipped].sort((a, b) => a.route.localeCompare(b.route));

			// Calculate max path length for alignment
			const maxPathLength = Math.min(Math.max(...allFiles.map((f) => f.route.length)), 60);

			// Format file size with KB and actual gzip size
			const formatFileSize = (bytes: number, gzBytes?: number) => {
				const kb = bytes / 1024;
				const sizeStr = kb < 100 ? kb.toFixed(2) : kb.toFixed(1);

				if (gzBytes !== undefined) {
					const gzKb = gzBytes / 1024;
					const gzStr = gzKb < 100 ? gzKb.toFixed(2) : gzKb.toFixed(1);
					return {
						size: sizeStr,
						gzip: gzStr,
					};
				}

				// Rough gzip estimation (typically 30-70% compression) if no actual gzip data
				const gzipKb = kb * 0.35;
				return {
					size: sizeStr,
					gzip: gzipKb < 100 ? gzipKb.toFixed(2) : gzipKb.toFixed(1),
				};
			};

			if (loaded.length > 0) {
				console.log("\n📁 Preloaded into memory:");
				console.log("Path                                          │    Size │ Gzip Size");
				loaded
					.sort((a, b) => a.route.localeCompare(b.route))
					.forEach((file) => {
						const { size, gzip } = formatFileSize(file.size);
						const paddedPath = file.route.padEnd(maxPathLength);
						const sizeStr = `${size.padStart(7)} kB`;
						const gzipStr = `${gzip.padStart(7)} kB`;
						console.log(`${paddedPath} │ ${sizeStr} │  ${gzipStr}`);
					});
			}

			if (skipped.length > 0) {
				console.log("\n💾 Served on-demand:");
				console.log("Path                                          │    Size │ Gzip Size");
				skipped
					.sort((a, b) => a.route.localeCompare(b.route))
					.forEach((file) => {
						const { size, gzip } = formatFileSize(file.size);
						const paddedPath = file.route.padEnd(maxPathLength);
						const sizeStr = `${size.padStart(7)} kB`;
						const gzipStr = `${gzip.padStart(7)} kB`;
						console.log(`${paddedPath} │ ${sizeStr} │  ${gzipStr}`);
					});
			}
		}

		// Show detailed verbose info if enabled
		if (VERBOSE) {
			if (loaded.length > 0 || skipped.length > 0) {
				const allFiles = [...loaded, ...skipped].sort((a, b) => a.route.localeCompare(b.route));
				console.log("\n📊 Detailed file information:");
				console.log(
					"Status       │ Path                            │ MIME Type                    │ Reason",
				);
				allFiles.forEach((file) => {
					const isPreloaded = loaded.includes(file);
					const status = isPreloaded ? "MEMORY" : "ON-DEMAND";
					const reason =
						!isPreloaded && file.size > MAX_PRELOAD_BYTES
							? "too large"
							: !isPreloaded
								? "filtered"
								: "preloaded";
					const route = file.route.length > 30 ? `${file.route.substring(0, 27)}...` : file.route;
					console.log(
						`${status.padEnd(12)} │ ${route.padEnd(30)} │ ${file.type.padEnd(28)} │ ${reason.padEnd(10)}`,
					);
				});
			} else {
				console.log("\n📊 No files found to display");
			}
		}

		// Log summary after the file list
		console.log(); // Empty line for separation
		if (loaded.length > 0) {
			log.success(
				`Preloaded ${String(loaded.length)} files (${(totalPreloadedBytes / 1024 / 1024).toFixed(2)} MB) into memory`,
			);
		} else {
			log.info("No files preloaded into memory");
		}

		if (skipped.length > 0) {
			const tooLarge = skipped.filter((f) => f.size > MAX_PRELOAD_BYTES).length;
			const filtered = skipped.length - tooLarge;
			log.info(
				`${String(skipped.length)} files will be served on-demand (${String(tooLarge)} too large, ${String(filtered)} filtered)`,
			);
		}
	} catch (error) {
		log.error(`Failed to load static files from ${clientDirectory}: ${String(error)}`);
	}

	return { routes, loaded, skipped };
}

/**
 * Initialize the server
 */
async function initializeServer() {
	log.header("Starting Production Server");

	// Load TanStack Start server handler
	let handler: { fetch: (request: Request) => Response | Promise<Response> };
	try {
		const serverModule = (await import(SERVER_ENTRY_POINT)) as {
			default: { fetch: (request: Request) => Response | Promise<Response> };
		};
		handler = serverModule.default;
		log.success("TanStack Start application handler initialized");
	} catch (error) {
		log.error(`Failed to load server handler: ${String(error)}`);
		process.exit(1);
	}

	// Build static routes with intelligent preloading
	const { routes } = await initializeStaticRoutes(CLIENT_DIRECTORY);

	// Static routes get security headers too
	const securedRoutes = Object.fromEntries(
		Object.entries(routes).map(([route, serve]) => [
			route,
			async (req: Request) => withSecurityHeaders(await serve(req)),
		]),
	);

	// Create Bun server
	const server = Bun.serve({
		port: SERVER_PORT,
		hostname: SERVER_HOST,
		maxRequestBodySize: 100_000_000,
		idleTimeout: 120,

		routes: {
			// Serve static assets (preloaded or on-demand)
			...securedRoutes,

			// Fallback to TanStack Start handler for all other routes
			"/*": async (req: Request, srv: Bun.Server<undefined>) => {
				try {
					// Overwrite (never trust) the client IP header the app uses for rate limiting.
					const forwarded = TRUST_PROXY
						? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
						: undefined;
					const ip = forwarded || srv.requestIP(req)?.address || "unknown";
					const headers = new Headers(req.headers);
					headers.set("x-qb-client-ip", ip);
					const response = await handler.fetch(new Request(req, { headers }));
					if (
						/^\/(dashboard|login|api\/(auth|media|account))(\/|$)/.test(new URL(req.url).pathname)
					) {
						response.headers.set("Cache-Control", "private, no-store");
					}
					return withSecurityHeaders(compressDynamic(req, response), req);
				} catch (error) {
					log.error(`Server handler error: ${String(error)}`);
					return new Response("Internal Server Error", { status: 500 });
				}
			},
		},

		// Global error handler
		error(error) {
			log.error(`Uncaught server error: ${error instanceof Error ? error.message : String(error)}`);
			return new Response("Internal Server Error", { status: 500 });
		},
	});

	log.success(`Server listening on http://${SERVER_HOST}:${String(server.port)}`);

	// Warm up: opens SQLite and applies migrations so problems surface at boot.
	const health = await handler.fetch(
		new Request(`http://127.0.0.1:${String(server.port)}/api/health`),
	);
	if (health.ok) log.success("Database ready");
	else log.error(`Health check failed at startup: ${await health.text()}`);

	const shutdown = (signal: string) => {
		log.info(`${signal} received, shutting down`);
		void server.stop().then(() => process.exit(0));
	};
	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

// Initialize the server
initializeServer().catch((error: unknown) => {
	log.error(`Failed to start server: ${String(error)}`);
	process.exit(1);
});
