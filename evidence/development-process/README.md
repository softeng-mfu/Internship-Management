# Development process, contributions and AI use

## Commits per author (VERIFIED from git history, all branches, 2026-11-10)

This counts commits only. It does **not** prove attendance, understanding or how much each person worked. Pairing, reviews and work committed by someone else are not visible here. **The team must confirm** this table and the identity mapping.

| Git identity | Commits | Dates | Main work (from commit messages) |
|---|---|---|---|
| `nadizeya` <nadizeya@gmail.com> | 10 | 2026-09-21 → 2026-11-09 | Webhook HMAC, Vercel deploy, internship frontend, public placements catalogue, authentication, PostgreSQL auth for production, Student Identity login + advisor accounts + unified workspace, merge of Job Board |
| `Nadi Zeya` (GitHub noreply, id 104029409) | 3 | 2026-08-17 → 2026-11-09 | README creation; merged PR #1 and PR #3 on GitHub |
| `ThanHtike01` <thanhtikezaw9090@gmail.com> | 4 | 2026-08-17 → 2026-11-09 | Initial files, **Team 18 Job Board integration** (`7bddfe5`), student-advisor connections + workspace fixes (`64e6b69`), readiness audit docs (`754ad2a`) |
| `MinThein-Kyaw` <6731503067@lamduan.mfu.ac.th> | 1 | 2026-11-09 | Refactor shared operator authentication for integration routes (`a1bcd7d`) |
| `kaungzeya-dev` (GitHub noreply) | 1 | 2026-09-21 | Webhook implementation (`d25c00e`) |

**To confirm:**

- `nadizeya` and `Nadi Zeya` are probably the same person (local git and GitHub web UI). Please confirm.
- Map each git identity to a student ID and name.
- Some members may have no commits under their own name. Record their real contributions (design, testing, docs, partner coordination) with evidence such as PR reviews, documents or meeting notes.
- The earlier audit noted a **repeated student ID** in the A5 evidence roster (`docs/A5-Team17-Integration-Evidence.md`). Please correct it.
- Several commit branches are named `codex/...`, which means some work was AI-assisted. Record that in the AI-use log below.

## AI-use log

Template: add one row per real AI use. Include a reviewed and redacted chat excerpt where useful. **Do not invent entries.**

| Date | Person | Tool | Task | What the AI suggested | Human review / correction | How it was validated |
|---|---|---|---|---|---|---|
| 2026-11-10 | Team member running the session (fill in name) | Claude Code (Claude Opus 5.5), terminal session | Execute `docs/Handover.md`: recheck production, run tests/build/audit, build the evidence folder and submission docs | Created branch `final-eval-handover`; wrote evidence README/manifest, submission docs, route recheck captures; marked screenshots and log evidence PENDING because it can't log in as real users | **To fill in**: what the reviewer changed or rejected before pushing | Tests 35/35, typecheck, build and audit re-run with saved output; every relative link checked by script; secret grep on new files; human review of the branch diff before push (**pending**) |
| | | (e.g. Codex, ChatGPT, Copilot) | | | | |
| | | | | | | |

The `docs/prompts/` folder has the prompt templates used during design (problem discovery → PRD → architecture review). Those are prompts, not evidence of reviewed results. Add the outputs and what you changed.
