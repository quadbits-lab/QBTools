import { useEffect, useState } from "react";

/** Object URL for a Blob, revoked automatically when it changes or unmounts. */
export function useObjectUrl(blob: Blob | null | undefined): string | undefined {
	const [url, setUrl] = useState<string>();
	useEffect(() => {
		if (!blob) {
			setUrl(undefined);
			return;
		}
		const next = URL.createObjectURL(blob);
		setUrl(next);
		return () => URL.revokeObjectURL(next);
	}, [blob]);
	return url;
}
