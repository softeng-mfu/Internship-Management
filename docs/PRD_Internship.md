# PRD — Internship (Team 17)

## Purpose
Track internship opportunities, applications, approvals, and progress for students and advisors.

## Scope
Screens: opportunity explorer, application tracker, advisor approval queue. Entities: Placement, Application, Approval, ProgressUpdate. REST: `GET /placements`, `GET /placements/{id}`, `POST /applications`, `GET /applications/me`, `PATCH /applications/{id}`, `POST /applications/{id}/approve`, `POST /progress-updates`.

## Integrations
Consume approved Identity profile/skills claims and Job Board listings. Publish `internship.status_changed` to Notification Hub, Advising, and Analytics. Campus Insights receives anonymised placement trends.

## AI and quality
AI matches skills to a placement; fallback filters by declared skill tags. Tests (minimum 7): browse, apply, duplicate application, advisor approval, progress update, identity consent, status event.
