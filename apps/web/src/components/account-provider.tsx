import { onThemeChange, setThemeMode } from "@qbtools/ui/theme";
import { toast } from "@qbtools/ui/toaster";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { api } from "#/lib/api-client";
import { authClient } from "#/lib/auth-client";
import { setAccountTools } from "#/lib/local-store";
import type { PersonalData } from "#/lib/media-contract";

type User = { id: string; name: string; email: string; image?: string | null };
const AccountContext = createContext<{
	user: User | null;
	data: PersonalData | null;
	pending: boolean;
	refresh: () => Promise<void>;
}>({ user: null, data: null, pending: false, refresh: async () => {} });
export const useAccount = () => useContext(AccountContext);
export function AccountProvider({ children }: { children: React.ReactNode }) {
	const session = authClient.useSession();
	const user = session.data?.user ?? null;
	const userId = user?.id;
	const [snapshot, setSnapshot] = useState<{ userId: string; data: PersonalData } | null>(null);
	const data = snapshot && snapshot.userId === userId ? snapshot.data : null;
	const [profileError, setProfileError] = useState("");
	const currentUser = useRef(userId);
	currentUser.current = userId;
	const currentData = useRef(data);
	currentData.current = data;
	const setData = useCallback((next: PersonalData | null) => {
		setSnapshot(next && currentUser.current ? { userId: currentUser.current, data: next } : null);
	}, []);
	const queue = useRef(Promise.resolve());
	const refresh = useCallback(async () => {
		if (!userId) {
			setData(null);
			return;
		}
		setProfileError("");
		const result = await api<PersonalData>("/api/account/profile");
		if (currentUser.current === userId) {
			currentData.current = result;
			setData(result);
		}
	}, [userId, setData]);
	useEffect(() => {
		setData(null);
		setAccountTools(null);
		if (!userId) return;
		void refresh()
			.then(() => {
				if (currentUser.current === userId && currentData.current)
					setThemeMode(currentData.current.preferences.theme);
			})
			.catch(() => setProfileError("Your dashboard could not load."));
		const focus = () => {
			void refresh().catch(() => {});
		};
		window.addEventListener("focus", focus);
		return () => {
			setAccountTools(null);
			window.removeEventListener("focus", focus);
		};
	}, [userId, refresh, setData]);
	useLayoutEffect(() => {
		if (!userId || !data) {
			setAccountTools(null);
			return;
		}
		setAccountTools({
			favorites: data.favorites,
			recent: data.recent,
			save(kind, slug, saved) {
				const previous = currentData.current;
				if (!previous || currentUser.current !== userId) return;
				const optimistic =
					kind === "favorite"
						? {
								...previous,
								favorites: saved
									? [slug, ...previous.favorites.filter((s) => s !== slug)]
									: previous.favorites.filter((s) => s !== slug),
							}
						: {
								...previous,
								recent:
									kind === "clear"
										? []
										: previous.preferences.track_recent
											? [slug, ...previous.recent.filter((s) => s !== slug)].slice(0, 50)
											: previous.recent,
							};
				currentData.current = optimistic;
				setData(optimistic);
				queue.current = queue.current.then(async () => {
					if (currentUser.current !== userId) return;
					try {
						await api(`/api/account/${kind === "favorite" ? "favorites" : "recent"}`, {
							method: kind === "clear" ? "DELETE" : "POST",
							...(kind === "clear"
								? {}
								: { body: JSON.stringify({ slug, ...(kind === "favorite" ? { saved } : {}) }) }),
						});
					} catch {
						if (currentUser.current === userId) {
							await refresh().catch(() => {
								if (currentUser.current === userId) setData(previous);
							});
							toast.error("Your change could not be saved. Try again.");
						}
					}
				});
			},
		});
	}, [data, userId, refresh, setData]);
	useEffect(
		() =>
			onThemeChange((theme) => {
				if (!userId || currentData.current?.preferences.theme === theme) return;
				void api("/api/account/preferences", { method: "PATCH", body: JSON.stringify({ theme }) })
					.then(refresh)
					.catch(() => toast.error("Theme could not sync. Try again."));
			}),
		[userId, refresh],
	);
	return (
		<AccountContext.Provider
			value={{ user, data, pending: session.isPending || Boolean(user && !data), refresh }}
		>
			{user && profileError && (
				<div role="alert" className="container-page py-3">
					{profileError}{" "}
					<button
						type="button"
						className="underline"
						onClick={() =>
							void refresh().catch(() => setProfileError("Still unavailable. Try again shortly."))
						}
					>
						Retry
					</button>
				</div>
			)}
			{children}
		</AccountContext.Provider>
	);
}
