"""
One-shot: convert every `"fieldtype": "Date"` to `"fieldtype": "Datetime"`
across madaar-apps doctype JSON files.

Run from repo root: `python scripts/convert_date_to_datetime.py`

Touches only files under madaar-apps/*/madaar_*/madaar_*/doctype/ — leaves
ERPNext / Frappe core alone. Stripping any UTF-8 BOM along the way (Frappe
migrate fails on BOM, per project memory).
"""
from __future__ import annotations

import json
import pathlib
import sys


def main() -> int:
    root = pathlib.Path(__file__).resolve().parent.parent / "madaar-apps"
    if not root.exists():
        print(f"madaar-apps not found at {root}", file=sys.stderr)
        return 1

    touched = 0
    converted_fields = 0
    for j in root.glob("*/madaar_*/madaar_*/doctype/*/*.json"):
        raw = j.read_bytes()
        if raw.startswith(b"\xef\xbb\xbf"):
            raw = raw[3:]
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"SKIP (bad json): {j} — {e}", file=sys.stderr)
            continue

        if not isinstance(data, dict) or data.get("doctype") != "DocType":
            continue
        fields = data.get("fields")
        if not isinstance(fields, list):
            continue

        changed_here = 0
        for f in fields:
            if isinstance(f, dict) and f.get("fieldtype") == "Date":
                f["fieldtype"] = "Datetime"
                changed_here += 1
        if changed_here:
            j.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
            touched += 1
            converted_fields += changed_here
            print(f"{j.relative_to(root.parent)}: {changed_here} field(s)")

    print(f"\n{touched} file(s) updated, {converted_fields} field(s) converted.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
