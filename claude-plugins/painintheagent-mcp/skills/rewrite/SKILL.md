---
name: rewrite
description: Use Pain in the Agent when the user asks to rewrite or humanize prose, compare versions, or check AI writing signals. Do not trigger for every writing task.
---

Use the supplied text only. The hosted service receives it and stores it under
https://painintheagent.com/privacy/. Do not gather additional files or include
secrets. If no text was provided, ask which draft to process.

Call `get_limits` when the account allowance or input size is uncertain. The
free allowance is shared with the website. Do not split an oversized document
or launch a batch without the user asking for that scope.

For deep rewriting, call `start_rewrite` once. Use the default `slop_removal: false` unless the user
also asks to remove formulaic AI phrasing. Save its `run_id`. Keep the MCP
process running and check `get_rewrite` after the suggested interval, normally
15 seconds. Status reads do not start model work or consume rewrite quota.

If a connection fails, retrieve the same ID. Never automatically submit the
text under a new ID. An interrupted run may not have a saved result. Explain
that outcome before deciding whether another run is appropriate.

Return the rewritten text and any fidelity notes. Check claims and conditions
before replacing a file or publishing. The service does not verify private
Claude or Gemini watermark keys, and a rewrite is not evidence of authorship.

For humanizing, use `start_humanize` with text and optional watermark_removal.
For comparison, use `start_watermark_comparison` with source_text and candidate_text.
For AI writing signals, use `start_ai_detection` with at least 80 words of
English or Russian. Each successful operation uses one shared account run.
Use get_result (or get_rewrite) with the returned run_id. Show quoted evidence
and explain that style signals do not prove who wrote the passage.

If authentication is missing, point the user to
https://painintheagent.com/integrations/ to create a key. The operator supplies
`PAININTHEAGENT_API_KEY` through the client's environment or secret settings.
Do not request a key in chat, print it, or write it to a project file. Respect
`PAININTHEAGENT_BASE_URL` when an API gateway is configured; failures must not
cause a fallback to a different endpoint or credential.
