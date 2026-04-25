# Repair Workflow

Use this reference when the user asks to lint, repair, clean up, or health-check a memex wiki.

## Goal

Use deterministic reports to fix safe mechanical issues and surface semantic issues for review.

## Steps

1. Run:
   ```bash
   memex lint
   ```
2. Run when link health matters:
   ```bash
   memex link-check
   ```
3. Classify findings:
   - safe mechanical fix
   - semantic fix requiring review
   - report-only issue
4. Apply safe fixes.
5. Ask before semantic rewrites, deletion, or uncertain merges.
6. Re-run checks when changes were made.
7. Append a short `log.md` entry for meaningful repairs.

## Safe Mechanical Fixes

Usually safe:

- add missing required frontmatter when values are obvious
- fix broken wikilinks caused by clear filename/title drift
- update `updated` date after a page edit
- add missing index entries for existing pages
- normalize obvious path separators

Still verify after editing.

## Requires Review

Ask before:

- deleting orphan pages
- merging duplicate-looking pages
- resolving contradictory claims
- rewriting large summaries
- changing page type
- moving pages across scenes

## Report Only

Report without editing when:

- a source is missing
- a claim lacks evidence and no source is available
- a contradiction needs domain judgment
- a page appears stale but no newer source is present

## Completion

Finish with:

- checks run
- fixes applied
- remaining issues
- user decisions needed

