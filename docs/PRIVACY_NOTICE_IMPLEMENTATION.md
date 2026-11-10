# First-visit privacy and security notice

Implemented locally on 10 November 2026 after updating main to `d38374b`. The local untracked handover prompt was backed up under `tmp/Handover-local-before-pull-*.md` before the incoming tracked handover was pulled. No existing accounts, project records or private settings were replaced.

## User flow

- On first visit, a native accessible dialog explains data use, sharing and safe account/report practices.
- Essential settings allow all features. They acknowledge the notice for the current browser tab, for at most 24 hours; they are not blanket consent to processing unrelated data.
- Optional remembering is unchecked on first visit. Explicitly enabling it stores a versioned preference on this device for at most 180 days.
- Privacy & security is always available to reopen choices. Choosing essential settings removes optional device storage; closing with Escape or the close button uses essential settings.
- `/privacy` is publicly readable without requiring a saved acknowledgement. The full notice is linked before any choice is made.
- Storage failure does not prevent access; a message explains that the choice applies for the current visit. Stale, expired or invalid preference records trigger a fresh notice.

The receipt contains only notice version, acknowledgement time, expiry and the optional remember flag. It contains no student ID, profile, password or token. This is a browser preference, not a server-side consent audit trail or account-wide permission grant. Clearing browser preferences does not delete account data. Student Identity sharing consent remains separately controlled by its provider.

## Contact and retention

The contact email explicitly supplied by the project owner is `nadizeya@gmail.com`. Privacy requests are handled manually; the UI does not promise an automated export/deletion workflow.

The recommended project target is manual review for deletion or anonymisation within 90 days after final evaluation, subject to documented assessment/legal obligations. This is a project recommendation, not a statutory retention period. No automatic cleanup or single hosting-log/backup retention schedule has been introduced or claimed.

## Notice accuracy and limits

The notice describes the current broad signed-in Identity claims integration rather than incorrectly claiming that every profile lookup is restricted to an assigned advisor. It also distinguishes self-registered advisor accounts from institutionally verified staff. This UI does not resolve those pre-existing authorization/governance issues, establish a legal basis for every processing operation, certify PDPA compliance or assess all international-transfer arrangements.

The responsible project team should confirm its institutional/controller details, applicable processing grounds, retention/backup operations and privacy-rights handling before a wider production release. Existing APIs and authorization policies have not been silently changed by this notice feature. No advertising/analytics option is fabricated: none is installed by this application.

## Sources used for notice design

- [Thailand MDES: PDPA B.E. 2562, unofficial English translation](https://www.mdes.go.th/law/detail/1905-Personal-Data-Protection-Act--B-E--2562--2019-), particularly sections 19 and 23 on clear consent requests and collection notices. Notice acknowledgement and optional device-storage permission are kept separate from unrelated processing consent.
- [PDPC privacy-notice guidance](https://www.pdpc.or.th/2304/), covering purposes and notification details.

These sources informed the structure; the product-specific statements come from the actual source and deployment architecture. This document does not substitute for a controller's legal assessment.

## Verification

Verified on 10 November 2026: all 36 regression tests passed, TypeScript passed and the production webpack build passed. Browser checks confirmed the first-visit dialog, unchecked optional storage, essential-only continuation, acknowledgement across reload, reopening settings, explicit remembering, withdrawal through keyboard dismissal and full-notice access. The live advisor smoke check passed login, protected workspace access, cross-origin write rejection and logout revocation. Do not commit screenshots containing credentials.

The owner requested this change be committed and pushed to main. Production deployment is separate; an existing Git-connected deployment may build automatically after the push.
