# Remaining directory submissions

These are prepared submission materials, not claims of acceptance.

## Shared listing copy

Name: **Pain in the Agent MCP**

Short description: **Rewrite text with fidelity checks using a shared free account allowance.**

Repository: https://github.com/krllagent/painintheagent-mcp

Setup: https://painintheagent.com/integrations/

Release: https://github.com/krllagent/painintheagent-mcp/releases/tag/v0.1.0

Category: Writing / Productivity, or the closest available category.

Support: https://github.com/krllagent/painintheagent-mcp/issues

The local stdio server runs with Node.js 22 or later. Its MCPB includes its
dependencies. `start_rewrite` returns a request ID, `get_rewrite` reads progress
or the saved result, and `get_limits` reads the existing free account allowance.
The browser and API share 100 successful rewrites per month and a maximum of
10,000 characters per text. API keys are issued and revoked on the setup page.
The service returns fidelity notes. It cannot verify private Claude/Gemini
watermark keys and does not guarantee detector outcomes.

## Smithery

The current [publishing guide](https://smithery.ai/docs/build/publish) accepts
local MCPB bundles. The release file above is ready for that path. Publication
requires a Smithery account/namespace; the API requires a bearer credential.
No account connection or credential is configured for this work, so nothing
has been submitted. Use the MCPB upload flow, not the remote HTTPS-server flow.
Confirm the free listing path before publishing; paid hosting is not requested.

## Glama

Clicking **Add Server** on the [directory](https://glama.ai/mcp/servers) opened
the sign-up/sign-in flow during the September 7 check. Authentication is needed
before submission. The repository now includes `glama.json`, validated against
Glama's own schema, naming the repository owner as maintainer. That file is
metadata and does not prove the server is listed or claimed.

## mcpservers.org

The [submission form](https://mcpservers.org/submit) states that standard
listings are free, with an optional $39 premium path. The free form requires a
contact email in addition to the public fields above. An approved contact email
has been requested. Do not choose the premium option.

## Cline

The [official submission instructions](https://github.com/cline/mcp-marketplace)
require confirmation that Cline successfully installed the server from the
README or `llms-install.md`, plus a 400×400 PNG. The general fresh-install MCP
test is complete, but an installation driven by Cline itself has not been
observed. The installation guide is ready; the confirmation must remain unticked
until that client check is performed.

The required [400×400 PNG](icon-400.png) is rendered from the existing site
favicon. It introduces no new brand asset or measured product claim.

## OpenAI public directory

The [submission process](https://developers.openai.com/plugins/deploy/submission)
requires a verified publisher identity, submission access, public MCP URL,
domain verification, review credentials where applicable, and five positive
plus three negative test cases. This release supplies a local stdio server.
The repository plugin can be installed in Codex, but it is not a remote MCP
submission for the universal public directory. A remote HTTP/OAuth extension
and an authenticated publisher session are still required for that path.

Prepared positive cases: read the account limits; rewrite a user-supplied
paragraph; poll progress and retrieve its fidelity notes; retrieve the same
request without another rewrite; request optional phrasing cleanup.

Prepared negative cases: revoked key is rejected; input over 10,000 characters
is rejected; another account cannot retrieve the request ID.

## Other indexes

MCP.so accepts community requests through GitHub issues; the submitted request
is tracked in `docs/distribution.md`. Other indexes may ingest the official MCP
Registry, but each searchable card needs its own verification. No automatic
appearance in PulseMCP, GitHub's curated gallery or an awesome-list is claimed.
