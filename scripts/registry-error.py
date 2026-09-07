"""Expose a bounded, redacted publisher error as a GitHub check annotation."""
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

text = Path(sys.argv[1]).read_text(errors="replace")[-8000:]
text = re.sub(r"https?://\S+", lambda match: urlunsplit((*urlsplit(match.group())[:3], "", "")), text)
text = re.sub(r"(?i)(bearer\s+)\S+", r"\1[redacted]", text)
text = re.sub(r"[A-Za-z0-9_-]{32,}", "[redacted]", text)
lines = [line for line in text.splitlines() if re.search(r"error|fail|invalid|denied|unauthor|forbidden|namespace|not found", line, re.I)]
message = "\n".join(lines[-8:] or text.splitlines()[-4:])[:1800]
message = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
print("::error title=MCP Registry publication::" + message)
