# Illustration feedback — minimal survey, version 2

## Audience and purpose

All current UX Squad designers. Gather preferences and actionable feedback on 3D with plinth, 3D without plinth and existing 2D illustration versions for Offers. Estimated time: about one minute; this estimate has not been timed with respondents. Participation is voluntary. No deadline, response count or outcome is assumed.

## Three questions

1. **Which Home Loan illustration works best?**
   - Three equally framed illustrations labelled A, B and C.
   - Tap an illustration to answer and move to the next question.
   - Alternatives: **No preference**, **None of these**.
2. **Which Personal Loan illustration works best?**
   - Same interaction and alternatives.
3. **Which style would you use overall?**
   - Both product examples displayed for each style, labelled **3D with plinth**, **3D without plinth**, **2D**.
   - Alternatives: **Depends on the product**, **No preference**, **None of these**.
   - **Add a comment (optional)** expands one field: **What would you keep or change?** Maximum 1,500 characters.
   - Selecting the recommendation does not submit. The participant taps **Send feedback** explicitly.

A/B/C assignment and product order are shuffled once per response and preserved throughout. Back retains earlier choices and allows changes. Artwork is always large; there is no size toggle. Options appear in three columns on desktop and one vertical column at 600 px and narrower. Nothing is preselected. The first two prompts explicitly say that choosing advances the survey.

The interface contains a small progress indicator, one question, artwork choices and essential actions. Alternative choices have clear bordered button surfaces. Privacy and setup footers have been removed at Harsh’s request; response collection still requires the endpoint setup documented in README. The previous introduction, navigation branding, sample offer cards, clarity questions, nine rating questions, prior-exposure question and separate review screen have been removed.

## Response handling

No name or email is requested. Feedback is stored in the survey owner's private Google Sheet. Draft answers stay in session storage in this browser tab. Nothing is sent before the explicit final action. The server confirms a saved row before the page thanks the participant. Unconfirmed submissions retain the same response ID for safe retry and pause edits. The previous survey uses a separate version and storage key; old drafts are not reinterpreted as new answers.

## Artwork and study limits

The six files in `dist/assets/` are unchanged copies from `../deck-html/3d-progress-leadership/assets/`:

| Product | With plinth | Without plinth | Existing 2D |
| --- | --- | --- | --- |
| Home Loan | `home-loan.png` | `home-loan-no-plinth-study-transparent-r7.png` | `home-loan-2d.webp` |
| Personal Loan | `personal-loan-original.png` | `personal-loan-no-plinth-draft-transparent-r7.png` | `personal-loan-2d.webp` |

- Plinth-free examples are existing studies with other geometry, material and detail differences. This measures preference for complete displayed versions, not the isolated effect of a plinth.
- All options use equal image frames in a given view. Frame sizes respond to the viewport; source aspect ratios and padding are preserved. Visible subject extents are not perfectly normalized.
- The 2D exports are low resolution; enlargement can reveal their limited resolution. No artwork was regenerated or upscaled.
- These are illustrations on a plain surface, not production offer placements. The survey no longer collects a separate small-size clarity score.
- Internal designer preference is not representative customer research, measured task success, an accessibility evaluation or formal approval.

## Reading results

One completed response is one row. `version_A/B/C` record the real style mapping for that respondent. Preference fields already store canonical style identifiers.

- Report each product's counts separately, with its denominator and the **no preference** / **none** categories.
- Report overall recommendation separately, including **depends**.
- Do not count the two product votes as two participants. With no identity collection, distinct submissions from the same person cannot be proven unique; transport retries are deduplicated.
- Summarize optional comments faithfully, preserving mixed and negative views. Blank comments mean no comment.
- Record actual dates and response counts after collection. No results have been inserted into the presentation.

Example after collection: “In an internal UX Squad survey, X of N responses preferred [style] for Home Loan. Personal Loan preferences were [split]. Comments highlighted [actual themes].”
