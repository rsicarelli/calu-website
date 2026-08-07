---
name: commit
description: >-
  Create a Conventional Commit for staged changes in this repo. Determines type/scope from the
  diff, enforces an imperative ≤72-char subject, appends the required Co-Authored-By trailer, and
  blocks AI promotional footers and staged secrets. Use when the user asks to "commit", "git
  commit", "commit message", or "commitar".
license: MIT
metadata:
  authors: Rodrigo Sicarelli
  version: "1.0.0"
---

# Commit

Single source of truth for commit conventions in `rsicarelli/calu-website`. Conventional Commits,
English, no AI promo footers, with a required co-authorship trailer.

Work happens **directly on `main`** — this is a closed repo with no PR flow.

## 1. Inspect state

```bash
git status
git diff --cached --stat
```

- If nothing is staged, show the changed files and ask what to stage. Stage **specific paths**
  with `git add <path>` — never `git add .` / `git add -A`.
- If files are already staged, do not re-stage them.
- **Block** if staged paths include secrets: `.env`, `*.pem`, `*.key`, `*credential*`, `*secret*`.
  Stop and warn instead of committing.

## 2. Determine type and scope from the diff

```bash
git diff --cached --name-only
git diff --cached
```

**Type** (Conventional Commits):

| Type | When |
|------|------|
| `feat` | New page, component, feature, or public behavior |
| `fix` | Bug fix |
| `docs` | Docs only (README, CLAUDE.md, content prose) |
| `refactor` | Restructure, no behavior change |
| `test` | Tests only |
| `chore` | Tooling, config, deps, skills, scaffolding |
| `perf` | Performance |
| `style` | Formatting/whitespace only |

**Scope** (optional — omit if changes span scopes or it adds no clarity):

| Scope | Paths |
|-------|-------|
| `pages` | `src/pages/**` |
| `layout` | `src/layouts/**` |
| `design` | `src/components/**`, `src/styles/**`, tokens, fonts |
| `content` | `src/content/**` |
| `seo` | metadata, JSON-LD, robots/sitemap |
| `cms` | CMS config and editing workflow |
| `infra` | hosting, deploy, headers, `astro.config.mjs` |
| `devex` | `Taskfile.yml`, `.githooks/**`, `.claude/**`, `eslint.config.js`, Prettier, `mise.toml` |
| `deps` | dependency bumps only |

## 3. Write the message

```
<type>[(scope)]: <subject>

[optional body — what & why, wrapped ~80 cols]

Co-Authored-By: <Agent> <Model> (<Context Window>) <noreply@anthropic.com>
```

Rules: subject ≤72 chars (aim 50), imperative mood ("add", not "added"), lowercase after the
colon, no trailing period, blank line before body. If the user gives a message verbatim, use it
as-is and only append the trailer.

Commit messages are in **English**, even though the site content is pt-BR.

## 4. Co-Authored-By trailer (required)

Every commit ends with a co-authorship trailer identifying the running agent — resolve the values
from the live session, do not hardcode:

```
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

**Forbidden:** any promotional footer ("Generated with Claude Code", badges, robot emoji + links).
If one appears, strip it and keep only the `Co-Authored-By` line.

## 5. Commit

```bash
git commit -m "$(cat <<'EOF'
<type>(scope): <subject>

<body>

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

Never use `--no-verify` (the `.githooks/pre-commit` DOD gate must run), `--amend` (unless the user
asks), or `--allow-empty`. If the pre-commit hook fails, read its output, fix, re-stage, and make a
**new** commit (do not amend a rejected commit). The hook runs `task fmt:check` + `typecheck` +
`lint`.

## 6. Verify

```bash
git log -1 --format="%H %s" && git status
```

Confirm a clean tree and show the hash + subject.

## Checklist

- [ ] Specific paths staged (no `git add .`); no secrets staged
- [ ] Type matches the change; scope correct or omitted
- [ ] Subject imperative, ≤72 chars, no trailing period
- [ ] `Co-Authored-By` trailer present; no promotional footer
- [ ] Pre-commit DOD hook passed (no `--no-verify`)
- [ ] Commit verified with `git log -1`
