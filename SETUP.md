# UX Squad illustration feedback survey

A minimal, approximately one-minute survey for all current UX Squad designers, comparing 3D with plinth, 3D without plinth and existing 2D illustrations. Uses the actual Home Loan and Personal Loan artwork from the leadership deck. Three required choices and one optional comment. Tap an image to advance through the first two questions; the final response sends only after tapping Send feedback.

**Status:** complete local survey and Google Sheets receiver template. No endpoint has been deployed, no responses collected, and no GitHub publication performed. Submission remains disabled until configured. Setup and privacy details are kept in this guide; they are not shown as survey footers.

The earlier version is retained in `ux-squad-illustration-survey-v1.zip`. If you already configured its response Sheet, use a fresh Sheet and the new `Code.gs` for version 2; do not mix the two column schemas.

## 1. Create the response Sheet

1. Create a blank Google Sheet named **UX Squad — Illustration feedback**. Keep its sharing restricted to the survey owner and intended reviewers.
2. Choose **Extensions → Apps Script**.
3. Replace the editor's starter code with the entire contents of **backend/Code.gs**. This is one self-contained script; do not paste `server.js` separately.
4. Find `SURVEY_ORIGIN` and replace `https://YOUR-USERNAME.github.io` with your GitHub Pages origin, for example `https://harsh.github.io`. Use only the origin, without a repository path or trailing slash. If you use a custom domain, use that origin.
5. Save, choose the `setup` function, and run it. Authorize the script in your Google account. This records the bound Sheet ID in Script Properties and creates the **Responses** tab with the correct column headers. It does not send any responses.
6. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and access to **Anyone** so designers can submit from the WhatsApp browser without a Google login. If your Workspace administrator does not offer that option, use an account or collection service permitted by your organisation; the public-page integration will not work with a sign-in-only endpoint.
7. Deploy and copy the web-app URL ending in `/exec`, not the development `/dev` URL.

The Sheet stays private even though its write-only endpoint is accessible to survey visitors. This is an invitation-link survey, not authenticated membership enforcement: anyone with the page can submit. No names, email addresses or device fingerprints are requested. Google/GitHub can retain their normal service logs; this is not a promise of platform-level anonymity. The endpoint is not a secret and must be visible to the browser.

## 2. Connect the page

Edit **dist/config.js**:

```js
window.SURVEY_CONFIG = Object.freeze({
  endpoint: "https://script.google.com/macros/s/YOUR-DEPLOYMENT-ID/exec"
});
```

Use the URL of the included script's deployment. An unrelated Apps Script or Google Form endpoint will not implement the expected confirmation protocol. No API key or Google credentials belong in this file.

## 3. Host on GitHub Pages

1. Create or use your chosen GitHub repository.
2. Upload the **contents** of `dist/` to the repository root: `index.html`, `styles.css`, `app.js`, `rules.js`, `config.js`, `.nojekyll` and `assets/`.
3. In **Settings → Pages**, choose **Deploy from a branch**, your publishing branch, and **/(root)**. Save.
4. Wait for the Pages deployment to finish. Open the URL shown in Settings → Pages. Relative asset paths support a repository URL such as `https://USERNAME.github.io/illustration-feedback/`.

No build step or package installation is required. Keep the backend script and any response exports outside the published folder. Do not put your response Sheet's contents in the repository.

## 4. Verify once before sending the WhatsApp invitation

- Open the published page on your phone. Artwork options should be large and stacked vertically.
- Check all six images, the alternative-choice buttons and back navigation.
- Complete a test response. Put **SETUP TEST — remove this row** in a comment.
- Confirm that the page says **Your feedback has been saved** and that exactly one new row appears in **Responses**.
- If confirmation fails, check that the origin is exact, `setup` was run, and the web app is deployed for Anyone. Apps Script code changes require **Deploy → Manage deployments → Edit → New version → Deploy**. Keep the same deployment URL when updating.
- If the row exists but the page timed out, use **Try sending again**. The same response ID is deduplicated. Edits are paused after a first submission attempt to avoid silently changing an already-saved response.
- Remove only the test row from the Sheet, leaving the headers. Start a new browser tab/session for another test if this tab already shows the completed screen.
- Open the survey link through WhatsApp and confirm the same flow there before inviting the group. If an embedded browser blocks Google's submission frame, open the link in the normal phone browser.

The page waits up to 45 seconds for the script's explicit acknowledgment. A submitted form or loaded iframe alone never counts as success. A network timeout may occur after a successful write; retry is safe for the same response ID.

## WhatsApp message

> Hi UX Squad! I’m gathering feedback on three illustration directions for Offers: 3D with a plinth, 3D without a plinth, and the existing 2D style.
>
> Please take about a minute to choose the illustrations you prefer. You can add a short comment at the end. All designers in the squad are invited. There’s no expected answer, and the survey doesn’t ask for your name or email.
>
> [PASTE SURVEY LINK]
>
> Please respond individually before discussing the options. Thank you!

## Reading the results

See **SURVEY.md** for the questionnaire and interpretation notes. One completed submission is one row. `version_A/B/C` contain the actual style identifiers for that respondent; do not count A/B/C as universal styles. Per-product preferences and overall direction already use canonical identifiers. Keep “no preference”, “none” and “depends” separate. Blank optional comments mean not provided. Version 2 has no rating or clarity fields.

## Validation and maintenance

Run `node --test tests/*.test.cjs` from this directory. The 27 tests cover tap-to-advance flow, Back and retained answers, explicit final submission, missing artwork, schema validation, neutral responses, randomized-order integrity, Sheets writing, deduplication, failure acknowledgments and spreadsheet-formula escaping. They use an in-memory Sheet adapter; they do not demonstrate a live Google deployment.

The editable receiver is `backend/server.js`, sharing rules with `dist/rules.js`. After editing either, regenerate `backend/Code.gs` by concatenating `dist/rules.js` and `backend/server.js`, in that order, and re-run tests. `Code.gs` is the file to paste into Google.

Static entrypoints, asset references and JS syntax were checked. A successful local HTTP response was checked. Live Google/WhatsApp/browser visual verification is pending the setup above. Optional read-only WebMCP draft access is feature-detected; no compatible validation context was available, so it is not claimed as verified.

Official setup references: [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web), [HTML sandbox restrictions](https://developers.google.com/apps-script/guides/html/restrictions), [iframe output settings](https://developers.google.com/apps-script/reference/html/html-output#setXFrameOptionsMode(XFrameOptionsMode)), [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
