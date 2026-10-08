# Southern Pines 2026 golf trip site

Static GitHub Pages site: everything is in `index.html`. Pushing to `main` publishes it
(live about a minute later at https://fritzwiltman.github.io/2026-southern-pines/).

## Posting round scores

The usual request: Fritz sends a photo of a scorecard (often from his phone through Remote
Control), sometimes with notes like "MC pressed after 4". The goal is to enter the gross
scores and publish them, but **only after Fritz confirms the numbers in chat**.

### 1. Read the card — don't edit anything yet

- Work out which round it is from the course name or date on the card, or from his message.
  Ask if it isn't clear.

  | id    | Day      | Course          | Format                          |
  |-------|----------|-----------------|---------------------------------|
  | `fri` | Fri 10/9 | Tot Hill Farm   | Sixes (presses possible)        |
  | `sat` | Sat 10/10| Southern Pines  | Nassau (presses possible)       |
  | `sun` | Sun 10/11| Mid Pines       | Individual net Stableford       |
  | `mon` | Mon 10/12| Pine Needles    | Individual net stroke play      |

- Read the **gross** score for Fritz, Von, Matt and Charlie on holes 1–18. Fritz writes stroke
  holes as gross/net, like `5/4`: use the first number. Initials or nicknames on the card map
  to those four players; ask if a row is ambiguous.
- Add up your numbers and compare with any Out / In / Total written on the card. A mismatch
  usually means a misread digit (4 vs 9, 1 vs 7, 3 vs 8): point it out.
- Friday and Saturday only: if he didn't mention presses, ask whether there were any.

### 2. Ask for confirmation

Reply with a compact table so he can check it against the card on his phone:

```
Friday · Tot Hill Farm
         1 2 3 4 5 6 7 8 9 | Out | 10 ... 18 | In | Tot
Fritz    ...
Von      ...
Matt     ...
Charlie  ...
Presses: M1, MC pressed after hole 4   (or "none")
Unsure:  Matt hole 7 — read as 6, could be 8
```

End with: **"Reply yes to post this, or send corrections."** Then stop and wait.

**Never edit `index.html`, commit or push before he clearly confirms** ("yes", "looks good",
"post it"). If he sends corrections, apply them and show the full table again.

### 3. After he confirms

1. `git pull --rebase origin main`
2. In `index.html`, inside the `ROUNDS` object near the top of the scorecard script, edit
   **only that round's** `scores` (and `presses` if there were any). Replace each `_` with
   the gross score and keep the existing spacing (nine holes, three spaces, nine holes):

   ```js
   Fritz:   [5, 4, 6, 5, 7, 4, 5, 6, 5,   6, 4, 5, 4, 6, 5, 7, 5, 6],
   ```

   Don't touch anything else: Saturday's teams, handicaps, payouts and results are all
   computed automatically.
3. Run `node scripts/scores.js <id>` (e.g. `node scripts/scores.js fri`). It must end with
   `OK`, and its Out / In / Tot must match the table he confirmed. If it prints `PROBLEMS`,
   don't push: explain the problem and ask him what to do.
4. Commit and push straight to `main`:
   `git add index.html && git commit -m "Post Friday scores" && git push origin main`
5. Reply with a short summary taken from the script output (match / bet winners, Stableford
   points or net totals, and who won money), and say the site updates in about a minute.

Corrections to a round that's already posted follow the same steps: show the corrected
holes, wait for confirmation, then edit, check and push.

### Data rules

- Scores are **gross only**. The site works out strokes, net scores and every result.
  `_` means not played yet.
- Presses (the site works out which team pressed; a press is only valid once that team is
  closed out, meaning down more holes than are left):
  - Friday: `{ match: 1, startHole: 4 }` = pressed after hole 4 of match 1. Matches are
    M1 holes 1–6, M2 7–12, M3 13–18.
  - Saturday: `{ bet: 'front', startHole: 7 }`, where bet is `'front'`, `'back'` or `'overall'`.
  - The check script lists any press the site ignored, with the reason.
- Saturday's teams come from Friday's finish (1st & 4th vs 2nd & 3rd). If the script says
  the teams are tied or not set, ask Fritz for the teams and fill in `teams` for that round,
  e.g. `teams: { A: ['Fritz', 'Matt'], B: ['Von', 'Charlie'] }`.
- If Monday moves to Talamore (the backup), swap the commented-out course line as the comment
  in the Monday round explains.

## Handicaps

`HANDICAP_INDEX` and each course's `courseHandicap` and `playingHandicap` (the 90% allowance) in
`COURSES` are copied from GHIN. Don't calculate them: GHIN takes 90% of the exact, unrounded
course handicap, so working it out from the rounded number can be off by one. If an index
changes, ask Fritz for the new GHIN numbers on each course.

## Other edits

Change only what's asked, match the existing style, check the page still works, and push to
`main` only after Fritz says to.
