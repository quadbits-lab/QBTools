import { expect, test } from "bun:test";
import { encodeWav, trimAudioBuffer } from "./index";

class TestAudioBuffer {
	readonly length: number;
	readonly numberOfChannels: number;
	readonly sampleRate: number;
	private channels: Float32Array[];
	constructor(options: { length: number; numberOfChannels: number; sampleRate: number }) {
		Object.assign(this, options);
		this.length = options.length;
		this.numberOfChannels = options.numberOfChannels;
		this.sampleRate = options.sampleRate;
		this.channels = Array.from(
			{ length: options.numberOfChannels },
			() => new Float32Array(options.length),
		);
	}
	getChannelData(channel: number) {
		const data = this.channels[channel];
		if (!data) throw new Error("Missing channel");
		return data;
	}
}
test("audio trimming preserves stereo samples and applies fades without changing the input", () => {
	const original = globalThis.AudioBuffer;
	globalThis.AudioBuffer = TestAudioBuffer as unknown as typeof AudioBuffer;
	try {
		const input = new TestAudioBuffer({ length: 8, numberOfChannels: 2, sampleRate: 4 });
		input.getChannelData(0).fill(1);
		input.getChannelData(1).fill(-1);
		const result = trimAudioBuffer(input as unknown as AudioBuffer, 0.5, 1.5, 0.5, 0.5);
		expect(result.length).toBe(4);
		expect(result.sampleRate).toBe(4);
		expect(result.numberOfChannels).toBe(2);
		expect([...result.getChannelData(0)]).toEqual([0, 0.5, 0.5, 0]);
		expect([...result.getChannelData(1)]).toEqual([-0, -0.5, -0.5, -0]);
		expect([...input.getChannelData(0)]).toEqual(Array(8).fill(1));
	} finally {
		globalThis.AudioBuffer = original;
	}
});
test("WAV output is signed 16-bit PCM with interleaved stereo and the original sample rate", async () => {
	const input = new TestAudioBuffer({ length: 2, numberOfChannels: 2, sampleRate: 44_100 });
	input.getChannelData(0).set([1, -1]);
	input.getChannelData(1).set([0.5, -0.5]);
	const blob = encodeWav(input as unknown as AudioBuffer);
	const view = new DataView(await blob.arrayBuffer());
	expect(blob.type).toBe("audio/wav");
	expect(new TextDecoder().decode(new Uint8Array(view.buffer, 0, 4))).toBe("RIFF");
	expect(view.getUint16(22, true)).toBe(2);
	expect(view.getUint32(24, true)).toBe(44_100);
	expect(view.getUint16(34, true)).toBe(16);
	expect([44, 46, 48, 50].map((offset) => view.getInt16(offset, true))).toEqual([
		32767, 16383, -32768, -16384,
	]);
});
