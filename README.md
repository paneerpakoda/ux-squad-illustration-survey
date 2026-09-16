# UX Squad illustration survey

[Public survey](https://paneerpakoda.github.io/ux-squad-illustration-survey/) · [Private response Sheet](https://docs.google.com/spreadsheets/d/1fQWhtnpCnlflpdUeA1AbiaKAp3d1MZu5c_OuiqHrCXs/edit) · [Collector editor](https://script.google.com/home/projects/1QN8FP2JI897YaI8iT-3H8swB9S8tfXpFWIXyTX14vn38wa72XXdWaR2j/edit)

## Version 3

Required name followed by eleven questions across six products. Large images, southwest two-wheeler pairs, two size checks, full Offers screen comparison, explicit Next/Back, and Send feedback. The Sheet stays private. Names and answers are recorded together in **Responses v3**; earlier **Responses** records remain unchanged. No email is requested. See SURVEY.md for interpretation and limits.

Publication status and live-save verification are recorded in RELEASE.md. Files in dist/ are published through the existing GitHub Pages workflow. Only confirmed Google acknowledgment shows success. A timeout preserves the exact pending payload and response ID; retry cannot add a duplicate with that ID. Fresh unfinished visits start blank; pending/submitted sessions are retained.

## Collector maintenance

The existing deployed endpoint is in dist/config.js. Reuse it. Update the bound Apps Script project with all of backend/Code.gs, save, then **Deploy → Manage deployments → Edit → New version → Deploy**. Retain Execute as Me and access Anyone. Existing SHEET_ID script property is reused; setup need not be rerun. Responses v3 is created on the first valid v3 submission. Earlier open v2 forms remain accepted and write to Responses.

Regenerate Code.gs by concatenating backend/rules-v2.js, dist/rules-v3.js, and backend/server.js. Do not insert names or response exports into GitHub. The public write-only endpoint is not an authentication boundary; anyone with the survey link can respond.

## Checks

Run `node --test tests/*.test.cjs`. Includes retained v2 regression cases, v3 validation/routing, name validation, formula escaping, deduplication and acknowledgment handling. Browser QA checks name, all twelve steps, blank selections, Back, mobile stacking, southwest assets, and final save. Unit/browser transport mocks alone do not prove live Google storage; RELEASE.md records the live check separately.

## WhatsApp invitation

Hi UX Squad! Please share your feedback on the three illustration directions for Offers. The form asks for your name, then compares six products and the Offers screen. Please respond individually before discussing the options—there’s no expected answer.

https://paneerpakoda.github.io/ux-squad-illustration-survey/

## Rollback

Git commit 06afe4f retains the prior public survey; the canonical workspace also has releases/v2-before-expanded/. Reverting the page to v2 does not require rolling back the compatible collector. Preserve both response tabs.

## Taking responses on one laptop

After each confirmed save, click **Start for next person**. The survey returns to a blank name entry with cleared answers and a new response ID. Previously saved responses stay in Google Sheets. If a save cannot be confirmed, retry it before handing over the laptop; the restart button appears only after confirmation.
