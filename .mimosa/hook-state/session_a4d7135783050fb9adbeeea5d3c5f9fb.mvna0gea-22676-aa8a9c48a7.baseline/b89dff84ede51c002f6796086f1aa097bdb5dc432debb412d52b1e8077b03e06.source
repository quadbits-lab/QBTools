import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qbtools/ui/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { GitHubIcon } from "#/components/github-icon";
import { authClient } from "#/lib/auth-client";
import { safeReturnPath } from "#/lib/media-contract";
import { seo } from "#/lib/seo";
import { sessionFn } from "#/server/auth.functions";

export const Route = createFileRoute("/login")({
	validateSearch: z.object({ redirect: z.string().optional(), error: z.string().optional() }),
	loader: () => sessionFn(),
	head: () =>
		seo({
			title: "Sign in",
			description: "Your QBTools dashboard and private media library.",
			path: "/login",
			noindex: true,
		}),
	component: LoginPage,
});

function LoginPage() {
	const { enabled, emailPasswordEnabled, githubEnabled } = Route.useLoaderData();
	const search = Route.useSearch();
	const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(
		search.error ? "Sign-in was cancelled or could not be completed. Please try again." : "",
	);

	// Sign In state
	const [loginIdentifier, setLoginIdentifier] = useState("");
	const [loginPassword, setLoginPassword] = useState("");

	// Registration state (Name, Email, Password, Phone, Username)
	const [regName, setRegName] = useState("");
	const [regUsername, setRegUsername] = useState("");
	const [regEmail, setRegEmail] = useState("");
	const [regPhone, setRegPhone] = useState("");
	const [regPassword, setRegPassword] = useState("");

	const destination = safeReturnPath(search.redirect) || "/dashboard";

	async function handleSignIn(e: React.FormEvent) {
		e.preventDefault();
		if (!loginIdentifier.trim() || !loginPassword) {
			setError("Please enter your email or username and password.");
			return;
		}
		setPending(true);
		setError("");
		try {
			const isEmail = loginIdentifier.includes("@");
			const result = isEmail
				? await authClient.signIn.email({
						email: loginIdentifier.trim().toLowerCase(),
						password: loginPassword,
					})
				: await authClient.signIn.username({
						username: loginIdentifier.trim(),
						password: loginPassword,
					});

			if (result.error) {
				setError(result.error.message || "Invalid credentials. Please check and try again.");
				setPending(false);
				return;
			}
			window.location.assign(destination);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign in failed. Try again.");
			setPending(false);
		}
	}

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		if (
			!regName.trim() ||
			!regUsername.trim() ||
			!regEmail.trim() ||
			!regPhone.trim() ||
			!regPassword
		) {
			setError("All fields (Name, Username, Email, Phone, Password) are required.");
			return;
		}
		if (regPassword.length < 8) {
			setError("Password must contain at least 8 characters.");
			return;
		}
		setPending(true);
		setError("");
		try {
			const result = await authClient.signUp.email({
				name: regName.trim(),
				username: regUsername.trim(),
				email: regEmail.trim().toLowerCase(),
				phone: regPhone.trim(),
				password: regPassword,
			});

			if (result.error) {
				setError(result.error.message || "Could not register account. Please try again.");
				setPending(false);
				return;
			}
			window.location.assign(destination);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Registration failed. Try again.");
			setPending(false);
		}
	}

	async function handleGitHubSignIn() {
		setPending(true);
		setError("");
		try {
			const result = await authClient.signIn.social({
				provider: "github",
				callbackURL: destination,
				errorCallbackURL: "/login?error=oauth",
			});
			if (result.error) throw new Error("GitHub sign-in could not start. Try again.");
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Try again.");
			setPending(false);
		}
	}

	return (
		<div className="container-page flex justify-center py-16">
			<section className="grid w-full max-w-lg gap-6 border border-input bg-surface p-8 shadow-sm">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">Your tools. Your workspace.</h1>
					<p className="mt-2 text-muted-foreground">
						Save favorite tools, continue across devices, and keep up to 10 GB of assets in your
						private Media Storage.
					</p>
				</div>

				{emailPasswordEnabled ? (
					<Tabs
						value={activeTab}
						onValueChange={(val) => {
							setActiveTab(val as "signin" | "register");
							setError("");
						}}
					>
						<TabsList className="w-full">
							<TabsTrigger value="signin" className="flex-1 justify-center">
								<Lock className="size-3.5" /> Sign In
							</TabsTrigger>
							<TabsTrigger value="register" className="flex-1 justify-center">
								<UserPlus className="size-3.5" /> Create Account
							</TabsTrigger>
						</TabsList>

						<TabsContent value="signin">
							<form onSubmit={handleSignIn} className="grid gap-4">
								<Field label="Email or Username" htmlFor="login-identifier">
									<Input
										id="login-identifier"
										type="text"
										autoComplete="username"
										placeholder="you@example.com or username"
										value={loginIdentifier}
										onChange={(e) => setLoginIdentifier(e.target.value)}
										disabled={pending}
										required
									/>
								</Field>
								<Field label="Password" htmlFor="login-password">
									<Input
										id="login-password"
										type="password"
										autoComplete="current-password"
										placeholder="••••••••"
										value={loginPassword}
										onChange={(e) => setLoginPassword(e.target.value)}
										disabled={pending}
										required
									/>
								</Field>
								<Button type="submit" disabled={pending} className="mt-2 w-full">
									{pending ? "Signing in…" : "Sign In"}
								</Button>
							</form>
						</TabsContent>

						<TabsContent value="register">
							<form onSubmit={handleRegister} className="grid gap-4">
								<Field label="Full Name" htmlFor="reg-name">
									<Input
										id="reg-name"
										type="text"
										autoComplete="name"
										placeholder="Alex Mercer"
										value={regName}
										onChange={(e) => setRegName(e.target.value)}
										disabled={pending}
										required
									/>
								</Field>
								<Field
									label="Username"
									htmlFor="reg-username"
									hint="Unique handle for sign-in and profile"
								>
									<Input
										id="reg-username"
										type="text"
										autoComplete="username"
										placeholder="alexmercer"
										value={regUsername}
										onChange={(e) => setRegUsername(e.target.value)}
										disabled={pending}
										required
									/>
								</Field>
								<Field label="Email Address" htmlFor="reg-email">
									<Input
										id="reg-email"
										type="email"
										autoComplete="email"
										placeholder="alex@example.com"
										value={regEmail}
										onChange={(e) => setRegEmail(e.target.value)}
										disabled={pending}
										required
									/>
								</Field>
								<Field label="Phone Number" htmlFor="reg-phone" hint="Mobile or work phone">
									<Input
										id="reg-phone"
										type="tel"
										autoComplete="tel"
										placeholder="+1 (555) 012-3456"
										value={regPhone}
										onChange={(e) => setRegPhone(e.target.value)}
										disabled={pending}
										required
									/>
								</Field>
								<Field label="Password" htmlFor="reg-password" hint="Minimum 8 characters">
									<Input
										id="reg-password"
										type="password"
										autoComplete="new-password"
										placeholder="••••••••"
										value={regPassword}
										onChange={(e) => setRegPassword(e.target.value)}
										disabled={pending}
										required
									/>
								</Field>
								<Button type="submit" disabled={pending} className="mt-2 w-full">
									{pending ? "Creating account…" : "Create Account"}
								</Button>
							</form>
						</TabsContent>
					</Tabs>
				) : null}

				{githubEnabled && (
					<>
						{emailPasswordEnabled && (
							<div className="relative my-1 text-center">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t border-input" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-surface px-2 font-mono text-muted-foreground">
										or continue with
									</span>
								</div>
							</div>
						)}
						<Button
							variant="secondary"
							disabled={pending || !enabled}
							onClick={handleGitHubSignIn}
							className="w-full"
						>
							<GitHubIcon />
							{pending ? "Connecting to GitHub…" : "Sign in with GitHub"}
						</Button>
					</>
				)}

				{!enabled && (
					<p role="status" className="text-sm text-muted-foreground">
						Authentication is being configured. Public tools remain available.
					</p>
				)}

				{error && (
					<p
						role="alert"
						className="border border-critical/30 bg-critical/10 p-3 text-sm text-critical"
					>
						{error}
					</p>
				)}

				<p className="flex gap-2 text-sm text-muted-foreground">
					<ShieldCheck className="size-5 shrink-0" />
					Tool processing stays on your device. Files upload only when you choose to save them.
				</p>
			</section>
		</div>
	);
}
