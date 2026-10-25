import { EFF_SHORT_WORDLIST } from "./wordlist";

export interface PasswordOptions {
	length: number;
	lowercase: boolean;
	uppercase: boolean;
	digits: boolean;
	symbols: boolean;
	excludeAmbiguous: boolean;
}

export interface PassphraseOptions {
	words: number;
	separator: string;
	capitalize: boolean;
	includeNumber: boolean;
}

const SETS = {
	lowercase: "abcdefghijklmnopqrstuvwxyz",
	uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	digits: "0123456789",
	symbols: "!@#$%^&*()-_=+[]{};:,.?/~",
} as const;
const AMBIGUOUS = /[Il1O0o|`'"]/g;

/** Uniform integer in [0, max) using rejection sampling (no modulo bias). */
export function secureRandomInt(max: number): number {
	if (!(max > 0) || max > 2 ** 32) throw new RangeError("max out of range");
	const limit = Math.floor(2 ** 32 / max) * max;
	const buffer = new Uint32Array(1);
	while (true) {
		crypto.getRandomValues(buffer);
		const value = buffer[0] ?? 0;
		if (value < limit) return value % max;
	}
}

function shuffle<T>(items: T[]): T[] {
	for (let i = items.length - 1; i > 0; i--) {
		const j = secureRandomInt(i + 1);
		[items[i], items[j]] = [items[j] as T, items[i] as T];
	}
	return items;
}

function activeSets(options: PasswordOptions): string[] {
	return (Object.keys(SETS) as (keyof typeof SETS)[])
		.filter((key) => options[key])
		.map((key) => (options.excludeAmbiguous ? SETS[key].replace(AMBIGUOUS, "") : SETS[key]));
}

/** Random password guaranteed to contain at least one character from each chosen set. */
export function generatePassword(options: PasswordOptions): string {
	const sets = activeSets(options);
	if (sets.length === 0) throw new Error("Choose at least one character type");
	const length = Math.max(options.length, sets.length);
	const pool = sets.join("");
	const chars = sets.map((set) => set[secureRandomInt(set.length)] as string);
	while (chars.length < length) chars.push(pool[secureRandomInt(pool.length)] as string);
	return shuffle(chars).join("");
}

export function passwordPoolSize(options: PasswordOptions): number {
	return activeSets(options).join("").length;
}

export function generatePassphrase(options: PassphraseOptions): string {
	const words = Array.from({ length: Math.max(1, options.words) }, () => {
		const word = EFF_SHORT_WORDLIST[secureRandomInt(EFF_SHORT_WORDLIST.length)] as string;
		return options.capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
	});
	if (options.includeNumber) {
		const at = secureRandomInt(words.length);
		words[at] = `${words[at]}${secureRandomInt(10)}`;
	}
	return words.join(options.separator);
}

export function passphraseEntropy(options: PassphraseOptions): number {
	const base = Math.max(1, options.words) * Math.log2(EFF_SHORT_WORDLIST.length);
	return options.includeNumber ? base + Math.log2(10 * options.words) : base;
}

export interface Strength {
	score: 0 | 1 | 2 | 3 | 4;
	label: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";
	entropyBits: number;
	crackTime: string;
}

const COMMON = new Set(
	"password password1 123456 12345678 123456789 qwerty qwerty123 abc123 111111 letmein welcome admin iloveyou monkey dragon football baseball sunshine princess master login passw0rd starwars whatever trustno1 hello123".split(
		" ",
	),
);

/** Estimate entropy for an arbitrary password from its character classes. */
export function estimateEntropy(password: string): number {
	if (COMMON.has(password.toLowerCase())) return 4;
	let pool = 0;
	if (/[a-z]/.test(password)) pool += 26;
	if (/[A-Z]/.test(password)) pool += 26;
	if (/\d/.test(password)) pool += 10;
	if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
	if (pool === 0) return 0;
	// Penalize repeated characters: count distinct-ish length.
	const effectiveLength = Math.min(password.length, new Set(password).size * 1.5);
	const bits = effectiveLength * Math.log2(pool);
	// Short single-class passwords are usually dictionary words.
	return /^[a-z]+$|^[A-Z]+$|^\d+$/.test(password) && password.length <= 12 ? bits * 0.6 : bits;
}

/** Offline attack at 10¹⁰ guesses/second, average case (half the space). */
function crackTimeFromEntropy(bits: number): string {
	const seconds = 2 ** (bits - 1) / 1e10;
	const units: [number, string][] = [
		[60 * 60 * 24 * 365 * 1e6, "million years"],
		[60 * 60 * 24 * 365, "years"],
		[60 * 60 * 24, "days"],
		[60 * 60, "hours"],
		[60, "minutes"],
	];
	if (seconds > 60 * 60 * 24 * 365 * 1e12) return "longer than the age of the universe";
	for (const [size, unit] of units) {
		if (seconds >= size) return `about ${Math.round(seconds / size).toLocaleString("en")} ${unit}`;
	}
	return seconds < 1 ? "instantly" : `${Math.round(seconds)} seconds`;
}

export function strengthFromEntropy(bits: number): Strength {
	const score: Strength["score"] =
		bits < 28 ? 0 : bits < 36 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
	const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;
	return { score, label: labels[score], entropyBits: bits, crackTime: crackTimeFromEntropy(bits) };
}
