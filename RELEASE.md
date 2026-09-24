# Version 3 release — 16 September 2026

Prepared twelve-step survey with required name, six products, two clarity checks, Offers screen context, family consistency and final recommendation. Both 3D two-wheelers use southwest view; the plinth asset has a new filename to avoid stale browser caches.

46 Node tests pass, including previous v2 regressions. Isolated Chromium: twelve-step flow, name validation, blank selections, Back retention, mobile stacking, all five southwest placements, intercepted save acknowledgment, submitted-session recovery and zero runtime errors pass. Generated image/background and low-resolution 2D limitations are documented in SURVEY.md.

Collector deployed successfully as Apps Script deployment version 2 at 14:01 IST, retaining the same endpoint and backward-compatible v2/v3 routing. Public code commit `628e022`; GitHub Pages run `35074358583` succeeded.

A real submission through the public GitHub page returned saved acknowledgment with all 16 fields, including the required name. Its exact synthetic UUID was confirmed in Responses v3 row 2 along with the SETUP TEST label. Only A2:Y2 was cleared afterward; headers and prior Responses tab were preserved. No JavaScript errors occurred. The page is ready to collect responses. No invitation was sent; physical phone/WhatsApp verification remains unclaimed.

Rollback: public commit 06afe4f. Compatible collector preserves v2 submissions and the original response tab.

## Shared-laptop collection

Added **Start for next person** after confirmed saves. It clears only this survey’s session, then initializes a blank name, empty choices/comments, fresh randomized assignments and a new response UUID. Name autocomplete is disabled. Saved Google Sheet rows are preserved; unconfirmed submissions keep the existing retry flow.

Local isolated Chromium verified two consecutive participants, separate UUIDs, no name/answer/comment carryover, success after refresh, a rejected submission followed by an identical-payload retry, unrelated session storage preservation, mobile fit and no JavaScript errors. Google requests were intercepted; no synthetic feedback was added to the live Sheet. All 46 Node tests pass.

Shared-laptop update deployed as `a2c6191`; Pages run `35075731515` succeeded. The same intercepted two-participant browser check also passed against the public GitHub page.

## 24 September — Vendor sharing and mobile verification

Mihika requested feedback from designers at partner vendors. Reused the existing public link, v3 response schema, collector endpoint and private Responses v3 tab. No backend or response changes. The anonymous collector status page is reachable.

Fixed a WebKit ResizeObserver notification loop in the Offers screen comparison: CSS now controls viewport aspect ratio, while the observer only scales the preview content. All 46 Node tests pass. Full twelve-step flows pass at 320, 360, 430, 768, 1024 and 1440 px in Chromium and at 390 px in WebKit, with loaded artwork, mobile stacking, no horizontal overflow, Back retention and no runtime errors. Submission confirmation was intercepted for these checks; no test rows were added. Prior real-save verification is recorded above.
