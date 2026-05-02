# Boro Batch Publishing Workflow

This is the repeatable workflow for the full `generate -> dedupe -> build manifest -> generate images -> publish` pipeline.

## What This Flow Assumes

- Draft generation uses `scripts/generate-batch-articles.js`.
- Image prompts and publish manifests live in `data/publishing/`.
- Single-article publish logic stays in `scripts/automate-publish.js`.
- Targeted staging is already enforced, so article publishes do not sweep unrelated working-tree files into commits.

## Step 1: Generate Drafts

Run the generator to create missing batch drafts.

```bash
node scripts/generate-batch-articles.js
```

What it does:

- Creates only missing draft files in `blog/`
- Skips files that already exist, which is the first dedupe layer
- Rewrites `data/publishing/batch-prompts-100.json` with the full prompt set for the batch topics

## Step 2: Build a Publish Manifest From Remaining Unpublished Drafts

Create a manifest from prompt-backed drafts that still exist locally but are not tracked in git yet.

```bash
node scripts/build-publish-manifest.js \
  --prompts data/publishing/batch-prompts-100.json \
  --output data/publishing/remaining-batch-selection.json \
  --name remaining-batch
```

Default behavior:

- Derives article slugs from `data/publishing/batch-prompts-100.json`
- Maps them to `blog/<slug>.md`
- Keeps only files that exist locally
- Excludes files already tracked in git

That git-tracked check is the formal dedupe layer for publication. In practice it means:

- already-published articles are skipped
- pre-existing tracked duplicates are skipped
- only still-unpublished local drafts remain in the manifest

Useful options:

```bash
node scripts/build-publish-manifest.js --batch-size 10 --start 0
node scripts/build-publish-manifest.js --batch-size 10 --start 10 --output data/publishing/remaining-batch-2.json
node scripts/build-publish-manifest.js --include-tracked
```

## Step 3: Dry-Run the Batch

Validate exactly which articles will run before any image generation or git activity.

```bash
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --dry-run
```

What the dry run verifies:

- each article file exists
- each prompt-backed article has exactly 3 prompt tasks
- the batch runner can resolve the right generation/publish steps

## Step 4: Publish the Batch

When the dry run is correct, execute the real batch.

```bash
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json
```

What happens for each article:

1. Writes a temporary `prompts.json` subset for that one article
2. Runs `scripts/generate-images.js`
3. Runs `scripts/automate-publish.js`
4. Deletes the temporary `prompts.json`
5. Commits and pushes only that article and its related assets

The runner resumes by default. If an article is already tracked in git, it is skipped automatically on rerun.

## Local Image Fallback When Stability Balance Is Unavailable

If Stability AI has no balance, generate the required source `.webp` files locally from the same prompt manifest.

```bash
node scripts/generate-local-prompt-images.js data/publishing/remaining-batch-selection.json
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --skip-image-generation
```

This creates the same source paths expected by the original pipeline:

- `assets/blog/<slug>-hero.webp`
- `assets/blog/<slug>-detail.webp`
- `assets/og/og-<slug>.webp`

Then `scripts/automate-publish.js` performs the normal optimization step and creates the final `-optimized.webp` and `-optimized.avif` files used by published articles.

## Step 5: Continue in Batches Until Empty

After one batch is published, build the next manifest from the remaining untracked drafts.

```bash
node scripts/build-publish-manifest.js \
  --prompts data/publishing/batch-prompts-100.json \
  --output data/publishing/remaining-batch-selection.json \
  --name remaining-batch
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --dry-run
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json
```

Repeat until the manifest contains zero articles.

## Existing Compatibility Entry Point

The old first-batch command still works:

```bash
node scripts/publish-first-batch.js
```

It now delegates to the general `scripts/publish-batch.js` runner.

## Recommended Operating Pattern

Use this exact order for future batches:

1. `node scripts/generate-batch-articles.js`
2. `node scripts/build-publish-manifest.js --output data/publishing/remaining-batch-selection.json --name remaining-batch`
3. `node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --dry-run`
4. `node scripts/publish-batch.js data/publishing/remaining-batch-selection.json`

## Notes

- Publication scheduling still comes from `scripts/automate-publish.js` and respects the existing max-2-posts-per-day logic.
- This workflow does slug/file-level dedupe, not semantic-topic dedupe.
- The manifest file is safe to regenerate at any time because it is derived from current filesystem state plus git tracked state.