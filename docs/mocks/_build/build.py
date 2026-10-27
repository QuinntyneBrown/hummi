"""Generate docs/mocks from the screens_*.py definitions.

    python docs/mocks/_build/build.py
    python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
"""
import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import kit  # noqa: E402
import screens_account  # noqa: E402
import screens_discover  # noqa: E402
import screens_overlays  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FOLDERS = {"page": "pages", "dialog": "dialogs", "notification": "notifications"}


def main():
    pages = screens_discover.SCREENS + screens_account.SCREENS
    page_by_id = {p["id"]: p for p in pages}
    for f in FOLDERS.values():
        shutil.rmtree(ROOT / f, ignore_errors=True)

    manifest = {"project": "Hummi", "screens": []}
    count = 0

    def emit(kind, s, state, body):
        nonlocal count
        out = ROOT / FOLDERS[kind] / s["id"] / f"{state}.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(kit.document(kind, s["id"], state, s["title"], f'{s["desc"]} ({state} state).', body, s["states"]), encoding="utf-8", newline="\n")
        count += 1

    def entry(kind, s):
        e = {"id": s["id"], "kind": kind, "title": s["title"], "states": s["states"]}
        if kind == "page":
            e["route"] = s["route"]
        else:
            e["opens_from"] = s["opens_from"]
        if s.get("na"):
            e["not_applicable"] = s["na"]
        manifest["screens"].append(e)

    for s in pages:
        entry("page", s)
        kit.set_pages_prefix("../")
        for st in s["states"]:
            emit("page", s, st, s["render"](st))

    for kind, group in (("dialog", screens_overlays.DIALOGS), ("notification", screens_overlays.NOTIFS)):
        for s in group:
            entry(kind, s)
            for st in s["states"]:
                kit.set_pages_prefix("../../pages/")
                under = page_by_id[s["opens_from"]]["render"]("default")
                emit(kind, s, st, s["render"](st, under))

    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(manifest['screens'])} screens, {count} files")


if __name__ == "__main__":
    main()
