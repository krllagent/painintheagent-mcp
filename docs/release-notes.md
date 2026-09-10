Version 0.2.0 adds the AI Humanizer, watermark text comparison and AI writing detector to the existing rewrite client. All tools use the same confirmed account and shared allowance as the website.

New tools: `start_humanize`, `start_watermark_comparison`, `start_ai_detection` and `get_result`. Existing rewrite calls and IDs remain compatible. The client rejects cross-tool ID reuse and preserves configured gateway routing without automatic POST retries.

Validated with fictional text over local HTTP and a fresh bundled MCP stdio process. No paid provider calls are needed for the client tests. AI writing signals describe style; they do not prove authorship or verify private vendor watermarks.
