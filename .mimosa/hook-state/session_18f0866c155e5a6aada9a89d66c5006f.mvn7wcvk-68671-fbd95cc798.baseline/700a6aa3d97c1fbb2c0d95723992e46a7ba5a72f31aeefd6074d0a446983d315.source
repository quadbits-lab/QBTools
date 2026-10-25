/** Creates only the disposable local test bucket. No production credentials. */
import { createHash, createHmac } from "node:crypto";

const endpoint = "http://127.0.0.1:19000";
const access = "qbtools-test-access",
	secret = "qbtools-disposable-test-secret";
const hmac = (key: string | Buffer, text: string) =>
	createHmac("sha256", key).update(text).digest();
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
async function signedPut(path: string, body = "", query = "") {
	const now = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
	const date = now.slice(0, 8);
	const host = new URL(endpoint).host;
	const scope = `${date}/us-east-1/s3/aws4_request`;
	const canonical = `PUT\n${path}\n${query}\nhost:${host}\nx-amz-content-sha256:${hash(body)}\nx-amz-date:${now}\n\nhost;x-amz-content-sha256;x-amz-date\n${hash(body)}`;
	const key = hmac(hmac(hmac(hmac(`AWS4${secret}`, date), "us-east-1"), "s3"), "aws4_request");
	const signature = createHmac("sha256", key)
		.update(`AWS4-HMAC-SHA256\n${now}\n${scope}\n${hash(canonical)}`)
		.digest("hex");
	const response = await fetch(`${endpoint}${path}${query ? `?${query}` : ""}`, {
		method: "PUT",
		headers: {
			"x-amz-date": now,
			"x-amz-content-sha256": hash(body),
			Authorization: `AWS4-HMAC-SHA256 Credential=${access}/${scope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
		},
		body,
	});
	if (!response.ok && response.status !== 409)
		throw new Error(`RustFS setup ${response.status}: ${await response.text()}`);
}
await signedPut("/qbtools-test");
await signedPut(
	"/qbtools-test",
	"<LifecycleConfiguration><Rule><ID>abort-incomplete</ID><Status>Enabled</Status><Filter><Prefix>users/</Prefix></Filter><AbortIncompleteMultipartUpload><DaysAfterInitiation>1</DaysAfterInitiation></AbortIncompleteMultipartUpload></Rule></LifecycleConfiguration>",
	"lifecycle=",
);
console.info("Disposable RustFS bucket ready.");
