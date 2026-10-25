import { FFmpegSession } from "@qbtools/engines/ffmpeg";
import { useEffect, useState } from "react";
export function useMediaSession() {
	const [session] = useState(() => new FFmpegSession());
	useEffect(() => () => session.dispose(), [session]);
	return session;
}
