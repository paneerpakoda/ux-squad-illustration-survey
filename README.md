# UX Squad illustration survey

A minimal survey comparing 3D with plinth, 3D without plinth and existing 2D illustrations, using Home Loan and Personal Loan examples.

- Three choices and one optional comment.
- Large artwork; vertically stacked options on mobile.
- Randomized A/B/C and product order, retained Back navigation and explicit final submission.
- GitHub Pages publishes only `dist/` through the included workflow.

## Response storage

Google Sheets collection is connected. A live browser test confirmed both the save acknowledgment and a response row; the labelled test record was cleared afterward.

GitHub Pages serves static files and cannot write responses to this repository. The included Google Apps Script receiver stores responses in a private Google Sheet. No GitHub token, API secret or response data should be added to the published files.

See [Google Sheets setup](SETUP.md), [survey questions and interpretation](SURVEY.md), and [receiver code](backend/Code.gs). For this GitHub Pages address, the script's allowed origin is `https://paneerpakoda.github.io`.

## Development

Serve `dist/` using any local static server. Run `node --test tests/*.test.cjs` for validation. Changes pushed to `main` run tests and publish the page.

The six illustration files are preserved exports. The plinth-free studies also have shape and material differences, so results compare complete displayed versions rather than isolating the plinth's effect.
