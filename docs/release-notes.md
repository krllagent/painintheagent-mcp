Version 0.3.1 states the detector length limit: without a monthly plan, comparisons and AI checks take texts of up to 1,000 characters through the API and this client, as on the website; with the plan, up to 10,000. Nothing else changes.

Version 0.3.0 describes the current offer and updates the MCP SDK. Rewrites (`start_rewrite`, `start_humanize`) use the characters of the account's monthly plan: $5 a month for 100,000 characters, up to 10,000 per text, shared with the website and the remote MCP. Comparisons and AI checks are free within 100 a day. Tool descriptions, the README, the plugin skill and the API reference now say so; earlier versions described a free allowance of runs.

`@modelcontextprotocol/sdk` moves to 1.32.1, which fixes GHSA-6qxp-vccf-f47h (OAuth client) and the later SDK advisories; transitive dependencies are updated too, and `npm audit --omit=dev` reports none. This server uses only the SDK's server and stdio modules over stdio, so earlier versions did not run the OAuth client code. Tool names, inputs and run IDs are unchanged.

Version 0.2.0 adds the AI Humanizer, watermark text comparison and AI writing detector to the existing rewrite client. All tools use the same confirmed account and shared allowance as the website.

New tools: `start_humanize`, `start_watermark_comparison`, `start_ai_detection` and `get_result`. Existing rewrite calls and IDs remain compatible. The client rejects cross-tool ID reuse and preserves configured gateway routing without automatic POST retries.

Validated with fictional text over local HTTP and a fresh bundled MCP stdio process. No paid provider calls are needed for the client tests. AI writing signals describe style; they do not prove authorship or verify private vendor watermarks.
