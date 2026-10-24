import { Badge } from "@qbtools/ui/badge";
import { Button } from "@qbtools/ui/button";
import { Input } from "@qbtools/ui/input";
import { Field } from "@qbtools/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qbtools/ui/tabs";
import { toast } from "@qbtools/ui/toaster";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, LogOut } from "lucide-react";
import { useState } from "react";
import { seo } from "#/lib/seo";
import { adminDataFn, adminLoginFn, adminLogoutFn } from "#/server/admin.functions";

export const Route = createFileRoute("/admin")({
	loader: () => adminDataFn(),
	head: () => seo({ title: "Admin", description: "QBTools admin", path: "/admin", noindex: true }),
	component: AdminPage,
});

type Row = Record<string, string | number | null>;

function toCsv(rows: Row[]): string {
	if (rows.length === 0) return "";
	const headers = Object.keys(rows[0] as Row);
	const cell = (value: unknown) => {
		const text = value === null || value === undefined ? "" : String(value);
		// Neutralize spreadsheet formula injection.
		const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
		return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
	};
	return [headers.join(","), ...rows.map((r) => headers.map((h) => cell(r[h])).join(","))].join(
		"\n",
	);
}

function exportCsv(name: string, rows: Row[]) {
	const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}

function DataTable({
	name,
	rows,
	columns,
}: {
	name: string;
	rows: Row[];
	columns: { key: string; label: string; mono?: boolean }[];
}) {
	return (
		<div>
			<div className="mb-3 flex items-center justify-between">
				<p className="text-sm text-muted-foreground">{rows.length} rows (latest 200)</p>
				<Button
					variant="secondary"
					size="sm"
					onClick={() => exportCsv(name, rows)}
					disabled={rows.length === 0}
				>
					<Download className="size-4" /> Export CSV
				</Button>
			</div>
			<div className="overflow-x-auto border border-border">
				<table className="w-full min-w-[48rem] text-left text-sm">
					<thead className="bg-muted text-muted-foreground">
						<tr>
							{columns.map((c) => (
								<th key={c.key} className="px-4 py-3 font-medium">
									{c.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className="px-4 py-10 text-center text-muted-foreground"
								>
									Nothing here yet.
								</td>
							</tr>
						) : (
							rows.map((row) => (
								<tr key={String(row.id)} className="border-t border-border align-top">
									{columns.map((c) => (
										<td
											key={c.key}
											className={`max-w-md px-4 py-3 whitespace-pre-wrap ${c.mono ? "font-mono text-xs" : ""}`}
										>
											{c.key === "createdAt"
												? new Date(String(row[c.key])).toLocaleString()
												: String(row[c.key] ?? "")}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function Login({ enabled }: { enabled: boolean }) {
	const router = useRouter();
	const login = useServerFn(adminLoginFn);
	const [token, setToken] = useState("");
	const [pending, setPending] = useState(false);
	return (
		<div className="container-page flex justify-center py-20">
			<form
				className="flex w-full max-w-md flex-col gap-5 border border-border bg-surface p-8"
				onSubmit={async (event) => {
					event.preventDefault();
					setPending(true);
					const result = await login({ data: { token } });
					setPending(false);
					if (result.ok) await router.invalidate({ sync: true });
					else toast.error(result.error);
				}}
			>
				<h1 className="text-2xl font-medium">Admin sign in</h1>
				{!enabled && (
					<p className="text-caution">
						Admin is disabled. Set ADMIN_TOKEN (16+ characters) in your environment.
					</p>
				)}
				<Field label="Admin token" htmlFor="admin-token">
					<Input
						id="admin-token"
						type="password"
						autoComplete="current-password"
						value={token}
						onChange={(e) => setToken(e.target.value)}
						disabled={!enabled}
					/>
				</Field>
				<Button type="submit" disabled={!enabled || pending || !token}>
					{pending ? "Checking…" : "Sign in"}
				</Button>
			</form>
		</div>
	);
}

function AdminPage() {
	const data = Route.useLoaderData();
	const router = useRouter();
	const logout = useServerFn(adminLogoutFn);
	if (!data.authorized) return <Login enabled={data.enabled} />;

	return (
		<div className="container-page py-10">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-medium tracking-[-0.035em]">Admin</h1>
					<p className="mt-1 text-muted-foreground">
						Messages, tool ideas, leads and the Premium waitlist.
					</p>
				</div>
				<Button
					variant="secondary"
					onClick={async () => {
						await logout();
						await router.invalidate({ sync: true });
					}}
				>
					<LogOut className="size-4" /> Sign out
				</Button>
			</div>
			<Tabs defaultValue="suggestions" className="mt-8">
				<TabsList>
					<TabsTrigger value="suggestions">
						Tool ideas <Badge className="ml-1">{data.suggestions.length}</Badge>
					</TabsTrigger>
					<TabsTrigger value="contacts">
						Messages <Badge className="ml-1">{data.contacts.length}</Badge>
					</TabsTrigger>
					<TabsTrigger value="leads">
						Leads <Badge className="ml-1">{data.leads.length}</Badge>
					</TabsTrigger>
					<TabsTrigger value="waitlist">
						Waitlist <Badge className="ml-1">{data.waitlistTotal}</Badge>
					</TabsTrigger>
				</TabsList>
				<TabsContent value="suggestions">
					<DataTable
						name="tool-ideas"
						rows={data.suggestions}
						columns={[
							{ key: "votes", label: "Votes", mono: true },
							{ key: "title", label: "Tool" },
							{ key: "category", label: "Category" },
							{ key: "details", label: "Details" },
							{ key: "email", label: "Email" },
							{ key: "createdAt", label: "Date" },
						]}
					/>
				</TabsContent>
				<TabsContent value="contacts">
					<DataTable
						name="messages"
						rows={data.contacts}
						columns={[
							{ key: "name", label: "Name" },
							{ key: "email", label: "Email" },
							{ key: "subject", label: "Subject" },
							{ key: "message", label: "Message" },
							{ key: "createdAt", label: "Date" },
						]}
					/>
				</TabsContent>
				<TabsContent value="leads">
					<DataTable
						name="leads"
						rows={data.leads}
						columns={[
							{ key: "name", label: "Name" },
							{ key: "email", label: "Email" },
							{ key: "company", label: "Company" },
							{ key: "service", label: "Service" },
							{ key: "budget", label: "Budget" },
							{ key: "message", label: "Message" },
							{ key: "createdAt", label: "Date" },
						]}
					/>
				</TabsContent>
				<TabsContent value="waitlist">
					<DataTable
						name="waitlist"
						rows={data.waitlist}
						columns={[
							{ key: "email", label: "Email" },
							{ key: "interest", label: "Interest" },
							{ key: "createdAt", label: "Date" },
						]}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
