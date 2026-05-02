# Boro Batch Publishing Workflow

This is the repeatable workflow for the full `batch-generate articles -> dedupe -> build manifest -> batch-generate Stability AI images -> date-based local commits -> manual push` pipeline.

## What This Flow Assumes

- Draft generation uses `scripts/generate-batch-articles.js`.
- Image prompts and publish manifests live in `data/publishing/`.
- Single-article publish logic stays in `scripts/automate-publish.js`.
- Targeted staging is already enforced, so article publishes do not sweep unrelated working-tree files into commits.
- Batch publishing creates local date-based commits only by default. Automated push is disabled for the standard SOP; final push must be performed manually by the repository owner.

## Critical Push Rule

Do not push automatically during batch publishing.

- Standard batch command: `node scripts/publish-batch.js <manifest>`
- This creates local commits only.
- Do not pass `--push` during the standard SOP.
- After all article/image commits are complete, review local commits and let the repository owner run `git push` manually.

## Step 1: Generate Drafts

Run the generator to create missing batch drafts.

```bash
node scripts/generate-batch-articles.js
```

What it does:

- Creates only missing draft files in `blog/`
- Skips files that already exist, which is the first dedupe layer
- Rewrites `data/publishing/batch-prompts-100.json` with the full prompt set for the batch topics

## Required Stability AI Image Prompt Flow

All production image generation must use Stability AI `v2beta/stable-image/generate/sd3` with model `sd3.5-large-turbo`.

Every image-generation task must use the fixed positive prompt wrapper below. Insert each image task's article-specific `coreConcept` / original image prompt at `[CORE_CONCEPT]`, then send the complete expanded prompt to Stability AI.

Positive prompt:

```text
A high-end 3D conceptual editorial illustration representing [CORE_CONCEPT], single unified scene, perfect human anatomy, accurate physics, strict logical structure. Sophisticated modern style, cinematic studio lighting, soft ambient occlusion, smooth textures. Professional harmonious color palette, minimalist uncluttered background, centered clean composition. 8K resolution, masterpiece, ultra-detailed, Unreal Engine 5, Octane Render style, premium corporate aesthetic, trending on ArtStation.
```

Negative prompt:

```text
bad anatomy, extra limbs, missing limbs, mutated hands, poorly drawn face, deformed, ugly, melted faces, floating objects, multiple balls, extra equipment, duplicated items, collage, grid layout, split screen, multiple panels, messy lines, illogical architecture, text, watermark, worst quality, low quality, jpeg artifacts, blurry, out of frame.
```

Implementation requirements:

- `scripts/generate-batch-articles.js` stores both `coreConcept` and the fully wrapped `prompt` for newly generated prompt tasks.
- `scripts/generate-images.js` normalizes older prompt manifests and sends the fully wrapped positive prompt plus the fixed negative prompt to Stability AI.
- Stability requests must use multipart form-data, not the legacy v1 JSON body.
- Stability requests must set `model=sd3.5-large-turbo`, `aspect_ratio=16:9`, and `output_format=webp`.
- `scripts/generate-local-prompt-images.js` also normalizes older prompt manifests before local fallback generation, while preserving the original `coreConcept` for contextual scene selection.
- The template must not be nested twice. If a prompt is already wrapped, reuse it as-is.
- For repair batches, first build a task list and generate only the first image for visual approval before running the rest.

Build the repair task list for an affected commit range:

```bash
node scripts/build-stability-repair-tasks.js \
  --from-commit <start-commit-sha> \
  --prompts-file data/publishing/batch-prompts-100.json \
  --output data/publishing/stability-repair-02867e8-tasks.json
```

Generate only the first sample image:

```bash
node scripts/generate-images.js \
  --prompts-file data/publishing/stability-repair-02867e8-tasks.json \
  --first-only \
  --overwrite \
  --with-optimized
```

Only after the sample is approved, generate the remaining tasks starting from task 2:

```bash
node scripts/generate-images.js \
  --prompts-file data/publishing/stability-repair-02867e8-tasks.json \
  --start 2 \
  --overwrite \
  --with-optimized
```

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

Validate exactly which articles will run before any image generation or git commit activity.

```bash
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --dry-run
```

What the dry run verifies:

- each article file exists
- each prompt-backed article has exactly 3 prompt tasks
- the batch runner can resolve the right generation/publish steps

## Step 4: Batch-Generate Stability Images and Create Date-Based Local Commits

When the dry run is correct, execute the real batch. This command generates each article's Stability AI images, optimizes image assets, schedules the article date, and creates a local commit for that article. It does not push.

```bash
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json
```

What happens for each article:

1. Writes a temporary `prompts.json` subset for that one article
2. Runs `scripts/generate-images.js` with Stability AI `sd3.5-large-turbo`
3. Applies the required positive prompt template and fixed negative prompt
4. Creates source `.webp` images plus optimized `.webp` and `.avif` assets
5. Runs `scripts/automate-publish.js --no-push`
6. Schedules the article date using the max-2-posts-per-day rule
7. Creates one local commit for that article and its related assets
8. Deletes the temporary `prompts.json`

The command intentionally does not push. The batch runner passes `--no-push` to `scripts/automate-publish.js` unless `--push` is explicitly supplied. Do not use `--push` in the standard workflow.

The runner resumes by default. If an article is already tracked in git, it is skipped automatically on rerun.

After all commits are complete, review the unpushed local commits:

```bash
git --no-pager log --oneline origin/main..HEAD
git status --short --branch
```

Only the repository owner should manually push after review:

```bash
git push
```

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

To repair and overwrite an already-published commit range, regenerate both source and optimized images directly from the affected article files:

```bash
node scripts/generate-local-prompt-images.js \
  --from-commit <start-commit-sha> \
  --prompts-file data/publishing/batch-prompts-100.json \
  --overwrite \
  --with-optimized
```

## Step 5: Continue in Batches Until Empty

After one batch is committed locally, build the next manifest from the remaining untracked drafts.

```bash
node scripts/build-publish-manifest.js \
  --prompts data/publishing/batch-prompts-100.json \
  --output data/publishing/remaining-batch-selection.json \
  --name remaining-batch
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --dry-run
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json
```

Repeat until the manifest contains zero articles. Do not push between batches unless the repository owner explicitly decides to push manually.

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
5. Repeat steps 2-4 until the manifest is empty
6. Review local commits with `git --no-pager log --oneline origin/main..HEAD`
7. Leave `git push` for manual repository-owner execution only

## Notes

- Publication scheduling still comes from `scripts/automate-publish.js` and respects the existing max-2-posts-per-day logic.
- This workflow does slug/file-level dedupe, not semantic-topic dedupe.
- The manifest file is safe to regenerate at any time because it is derived from current filesystem state plus git tracked state.
- `scripts/publish-batch.js` defaults to local commits only. Automated push requires an explicit `--push` flag and is not part of this SOP.