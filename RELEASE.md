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

Mobile fix published from `62696ff`; GitHub Pages run `35964565723` succeeded.
Hosted verification also passed all seven browser/width cases after deployment. Google requests were intercepted during the full flows.

## 24 September — Original 2D artwork

Replaced all six active 2D comparisons with the user-supplied 360 × 255 PNG originals, byte-identical to the source files. New filenames and catalogue cache version avoid reusing the blurry WebP cache. 3D artwork, display slots, questionnaire, collector and existing responses are unchanged. Earlier findings belong to the earlier artwork; SURVEY.md records the deployment-boundary limitation.

Validation: all six replacements match source SHA-256 hashes. All 25 active 2D placements load the 360 × 255 originals across the twelve-step flow; Chromium 320/1440 px and WebKit 390 px pass with no overflow/runtime errors. All 46 Node tests pass. Google submissions were intercepted; no test rows were added.

Published as `24eee2e`; Pages run `35979769111` succeeded and completed at 24 September 2026, 14:42:19 IST. Use this recorded cutover with the already-open-page caveat when analysing response timing.
Hosted full-flow checks passed on Chromium 320/1440 px and WebKit 390 px after deployment; every replacement has the expected original dimensions.

## 24 September — Southwest pairs, optional details and phone viewports

Published code `366a9283731ce4e8a4ef6b42242b9dedac17866d`; Pages run `35982603079` succeeded at 15:10:21 IST. Existing collector updated to Apps Script deployment version 4 at 15:08 IST, keeping the same endpoint and private Sheet.

Home and Car now use southwest views in both 3D treatments throughout the survey. With-plinth files are supplied Version 02 originals; reference-edited no-plinth files remain study candidates. Other 3D views were checked against the supplied Offers screen; RuPay remains unchanged because it is absent from that reference. The six sharp 2D originals remain unchanged.

Each feedback question offers optional multi-select reasons and custom text. Question 10 shows a cropped 360 × 800 viewport inside each phone frame, with an illustrative-purpose note above the choices. Mobile comparisons stack vertically. New rows include artwork revision `sw-reasons-2026-09-24`. Responses v3 columns A:Y are preserved; additional_details, details_json and artwork_revision append at Z:AB. Old payloads and pending retries remain supported.

Validation: 51 Node tests pass, including old-header migration, grid expansion, prior retry compatibility, multi-select/custom persistence, input validation and deduplication. Local browser checks verified optional blank details, Back retention, all eleven details sections, loaded artwork, 360:800 crop and no horizontal overflow at 320/768/1024/1440 px. No runtime errors in local or hosted checked flows. Physical handset/WhatsApp testing is not claimed.

A labelled live submission through the hosted survey returned confirmed success. Responses v3 row 24 contained UUID 98c72372-61f4-4a98-919d-5f4830fe0bc1, all eleven details objects with two selections and custom text each, and the correct artwork revision. Only the verified synthetic range A24:AB24 was cleared afterward; existing participant rows and headers remain. Start for next person returned to a blank name entry.
