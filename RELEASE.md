# Version 3 release — 16 September 2026

Prepared twelve-step survey with required name, six products, two clarity checks, Offers screen context, family consistency and final recommendation. Both 3D two-wheelers use southwest view; the plinth asset has a new filename to avoid stale browser caches.

46 Node tests pass, including previous v2 regressions. Isolated Chromium: twelve-step flow, name validation, blank selections, Back retention, mobile stacking, all five southwest placements, intercepted save acknowledgment, submitted-session recovery and zero runtime errors pass. Generated image/background and low-resolution 2D limitations are documented in SURVEY.md.

Collector code saved in existing Google Apps Script project; backward-compatible v2/v3 routing and Responses v3 tab. Google deployment/public Pages/live storage verification in progress.

Rollback: public commit 06afe4f. Compatible collector preserves v2 submissions and the original response tab.
