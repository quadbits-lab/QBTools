import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "#/components/page";
import { seo } from "#/lib/seo";
import { SITE_NAME } from "#/lib/site";

export const Route = createFileRoute("/disclaimer")({
	head: () => seo({ title: "Disclaimer", description: `Important notes about results from ${SITE_NAME} calculators, AI helpers and file tools.`, path: "/disclaimer" }),
	component: () => (
		<LegalPage title="Disclaimer" updated="24 October 2026">
			<p>The information and tools on {SITE_NAME} are provided for general help and convenience only.</p>
			<h2>Calculators</h2>
			<p>
				Results from the EMI, percentage, GPA, age and BMI calculators are estimates. They are <strong>not financial, medical or academic advice</strong>. Loan
				offers may include fees and taxes not shown here; universities use their own grading rules; BMI is a screening measure, not a diagnosis. Please confirm
				important decisions with a qualified professional or the relevant institution.
			</p>
			<h2>AI helpers</h2>
			<p>AI-generated corrections and rewrites can contain mistakes. Always review the result before using it, and follow your school's or employer's rules on AI use.</p>
			<h2>File tools</h2>
			<p>Compression and conversion can change quality. Keep your original files. We are not responsible for lost or altered files.</p>
			<h2>Signatures and invoices</h2>
			<p>Signature images and generated invoices may not meet legal or tax requirements in every country. Check what your situation requires.</p>
			<h2>External links</h2>
			<p>We may link to other websites. We are not responsible for their content or privacy practices.</p>
		</LegalPage>
	),
});
