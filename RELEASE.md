# Version 3 release — 16 September 2026

Prepared twelve-step survey with required name, six products, two clarity checks, Offers screen context, family consistency and final recommendation. Both 3D two-wheelers use southwest view; the plinth asset has a new filename to avoid stale browser caches.

46 Node tests pass, including previous v2 regressions. Isolated Chromium: twelve-step flow, name validation, blank selections, Back retention, mobile stacking, all five southwest placements, intercepted save acknowledgment, submitted-session recovery and zero runtime errors pass. Generated image/background and low-resolution 2D limitations are documented in SURVEY.md.

Collector deployed successfully as Apps Script deployment version 2 at 14:01 IST, retaining the same endpoint and backward-compatible v2/v3 routing. Public code commit `628e022`; GitHub Pages run `35074358583` succeeded.

A real submission through the public GitHub page returned saved acknowledgment with all 16 fields, including the required name. Its exact synthetic UUID was confirmed in Responses v3 row 2 along with the SETUP TEST label. Only A2:Y2 was cleared afterward; headers and prior Responses tab were preserved. No JavaScript errors occurred. The page is ready to collect responses. No invitation was sent; physical phone/WhatsApp verification remains unclaimed.

Rollback: public commit 06afe4f. Compatible collector preserves v2 submissions and the original response tab.
