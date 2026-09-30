#!/usr/bin/env python3
"""Auto-inject Jekyll / Chirpy front matter into posts that lack it.

Why: writing YAML by hand in Obsidian is annoying. This script lets you drop a
plain Markdown note into _posts/ and have the front matter generated at build
time, so it is never needed on the Obsidian side.

Rules
-----
* Files that already start with ``---`` are left untouched.
* Date and title are taken from the filename ``YYYY-MM-DD-Title.md``.
* If the body starts with an ``# Heading``, that heading wins as the title and
  the heading line is removed (avoids rendering the title twice).
* Files without a ``YYYY-MM-DD`` filename prefix are skipped with a warning.
* Files whose name is only a date (``2026-09-29.md``) still need a title from an
  ``# Heading``; otherwise they are skipped.

Usage: python3 tools/auto_frontmatter.py [posts_dir]
"""

from __future__ import annotations

import os
import re
import sys
from datetime import datetime, timezone, timedelta

DEFAULT_DIR = "_posts"
AUTHOR = "rick"
TZ = timezone(timedelta(hours=8))  # Asia/Shanghai

FILENAME_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})-(.+)$")
DATE_ONLY_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
H1_RE = re.compile(r"^#\s+(.+?)\s*$")


def build_front_matter(title: str, dt: datetime) -> str:
    return (
        "---\n"
        f"author: {AUTHOR}\n"
        f"title: {title}\n"
        f"date: {dt.strftime('%Y-%m-%d %H:%M:%S %z')}\n"
        "---\n\n"
    )


def process(path: str) -> str | None:
    """Return a note describing the action, or None when nothing was done."""
    name = os.path.basename(path)
    if not name.endswith(".md"):
        return None

    with open(path, "r", encoding="utf-8") as fh:
        text = fh.read()

    if text.lstrip().startswith("---"):
        return None  # already has front matter

    stem = name[:-3]
    match = FILENAME_RE.match(stem)
    date_only = DATE_ONLY_RE.match(stem)

    if not match and not date_only:
        return f"SKIP   {name} (filename needs a YYYY-MM-DD- prefix)"

    if match:
        dt = datetime(int(match.group(1)), int(match.group(2)), int(match.group(3)), tzinfo=TZ)
        title = match.group(4).replace("-", " ").strip()
    else:
        dt = datetime(
            int(date_only.group(1)), int(date_only.group(2)), int(date_only.group(3)), tzinfo=TZ
        )
        title = ""

    # Keep the file's own modification time as the publication time.
    mtime = datetime.fromtimestamp(os.path.getmtime(path), tz=TZ)
    dt = dt.replace(hour=mtime.hour, minute=mtime.minute, second=mtime.second)

    body = text
    lines = text.splitlines()
    for idx, line in enumerate(lines):
        if not line.strip():
            continue
        h1 = H1_RE.match(line)
        if h1:
            title = h1.group(1).strip() or title
            body = "\n".join(lines[:idx] + lines[idx + 1 :]).lstrip("\n")
        break

    if not title:
        return f"SKIP   {name} (no title in filename or '# Heading')"

    with open(path, "w", encoding="utf-8") as fh:
        fh.write(build_front_matter(title, dt) + body)

    return f"INJECT {name} -> title={title!r} date={dt:%Y-%m-%d %H:%M}"


def main() -> int:
    posts_dir = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DIR
    if not os.path.isdir(posts_dir):
        print(f"posts dir not found: {posts_dir}")
        return 1

    changed = 0
    for root, dirs, files in os.walk(posts_dir):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for filename in sorted(files):
            result = process(os.path.join(root, filename))
            if result:
                print(result)
                if result.startswith("INJECT"):
                    changed += 1

    print(f"auto_frontmatter: {changed} post(s) received generated front matter")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
