# Watermark API v1

Base URL: `https://painintheagent.com`. Send the account key as `Authorization: Bearer YOUR_KEY`. Create and revoke keys on the [integration page](https://painintheagent.com/integrations/). API calls never use browser cookies as an authentication fallback.

`GET /api/v1/watermark/limits` returns `runs_used`, `runs_limit`, `max_chars`, `min_chars`, `period` and `shared_with_browser`. Only successful rewrites count toward the monthly allowance, while pending requests reserve slots. Quotas and request throttles can reject a new run with HTTP 429.

`POST /api/v1/watermark/run` requires `Content-Type: application/json`:

```json
{
  "text": "A fictional team expects to finish a small pilot next week if the supplier delivers on time. These conditions should remain intact when the paragraph is rewritten.",
  "run_id": "8d109d1b-fc24-4d28-91ea-3dd3eb5a0c71",
  "slop_removal": false
}
```

The text above is a fictional example. Replace it with your draft. Generate a lowercase UUID before submitting and save it. Only these three fields are accepted. Omit `slop_removal` to leave it off. There is no Turnstile field in the authenticated API.

A newly accepted request returns HTTP 200 with `Content-Type: application/x-ndjson`. Keep the connection open and read until one terminal line:

```json
{"type":"progress","pass":1,"stage":"semantic-audit","attempt":1,"elapsed_ms":18000}
{"type":"result","run_id":"8d109d1b-fc24-4d28-91ea-3dd3eb5a0c71","text":"Rewritten text.","review":[],"review_status":"ok","runs_used":1,"runs_limit":100}
```

These are shortened fictional protocol examples. Terminal errors use `type: "error"`, `error_code` and a message. Since headers were already sent, a terminal error inside the stream still has HTTP status 200.

`GET /api/v1/watermark/run?id=UUID` returns JSON with `status: "pending"`, `"success"` or `"error"`. A pending reply can include the last progress event. A success includes the rewritten text and fidelity information. Reading a result does not use rewrite quota. Unknown IDs and IDs owned by a different account return HTTP 404.

POSTing the same ID with the same text and slop option returns that run's current JSON status without model work. Changed input with the same ID returns HTTP 409. Completed and failed IDs are never automatically reused. If the connection failed before an ID was accepted, a GET can return 404; investigate before making another POST.

Common HTTP errors include 400 for invalid input, 401 for an invalid or revoked key, 409 for an ID conflict, 413 for an oversized body, 429 for a quota or rate limit, and 503 when a required service is unavailable. Pipeline errors can include `output_validation_failed`, `provider_failed`, `rewrite_failed`, and `run_interrupted`. No API response establishes authorship or confirms a private watermark was removed.

API keys share the account's access to saved runs from the web tool and API. They cannot create or revoke keys. Revoke unused keys in the browser. The service has a 30-minute provider-work deadline; an interrupted pending reservation expires after one hour. Continuing after the MCP process closes is not guaranteed.
