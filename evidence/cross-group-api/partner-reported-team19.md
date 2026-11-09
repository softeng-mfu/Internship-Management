# PARTNER-REPORTED: Team 19 consumes Team 17's placements API

Status: **PARTNER-REPORTED**. Our side has not matched this with our own logs yet.

Source: https://github.com/6731503083-pablo/mfu-alumni-network (read 2026-11-10 via the GitHub API; evidence files added in their commit `e3c6492`, 2026-11-09T07:14:07Z).

What Team 19 reports (quoted from `evidence/team17-internships-live-call.txt` in their repo):

- Their worker called our `GET /api/placements?status=open&page=1&limit=5&category=Engineering` (their worker asked for limit=5; their diagram mentions limit=10).
- Result: 200 in 1430 ms, 2 listings (Frontend Developer Intern / Sample Web Lab; Software Engineering Intern / Sample Systems).
- Time: 2026-11-09T07:13:44.748Z (14:13 Bangkok).
- Our request ID as they received it: `a461ec05-1277-4b26-a79a-ed2b280d8ed7`.
- Their screenshots: `evidence/team17-internships-live.png` and `evidence/team17-find-a-mentor-live.png` in their repository. We have **not** copied them here because they are Team 19's images.

Their requests to us (from `handover/README.md`):

1. Find that request ID in our logs and send them a screenshot.
2. Optionally integrate their `GET /api/mentors` (not done).
3. **Keep our API online on 10 November 2026, 13:00–18:00** for their final evaluation.

Draft reply for the team to review and send yourselves. This session did not send it:

> Hi Team 19, thanks for the integration evidence. Our `/api/placements` API is live and we'll keep it online on 10 Nov 13:00–18:00. We're checking our Vercel logs for request ID a461ec05-1277-4b26-a79a-ed2b280d8ed7 and will send you the screenshot. — Team 17
