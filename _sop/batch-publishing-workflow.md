# Boro 批次發布工作流程

這是一套可重複執行的完整流程，用於處理 `批次產生文章 -> 去重 -> 建立 manifest -> 批次產生 Stability AI 圖片 -> 依日期建立本地 commit -> 手動 push`。

## 此流程的前提假設

- 草稿產生使用 `scripts/generate-batch-articles.js`。
- 圖片 prompts 與 publish manifests 存放在 `data/publishing/`。
- 單篇文章的發布邏輯維持在 `scripts/automate-publish.js`。
- 目前已經有針對性 staging，因此文章發布時不會把無關的 working tree 檔案一起納入 commit。
- 批次發布預設只建立本地、依日期切分的 commits。標準 SOP 禁止自動 push；最後的 push 必須由 repository 擁有者手動執行。

## 關鍵 Push 規則

批次發布過程中不得自動 push。

- 標準批次指令：`node scripts/publish-batch.js <manifest>`
- 這個指令只會建立本地 commits。
- 標準 SOP 中不要傳入 `--push`。
- 當所有文章與圖片的 commits 都完成後，先檢查本地 commits，再由 repository 擁有者手動執行 `git push`。

## 步驟 1：產生草稿

執行產生器，建立缺少的批次草稿。

```bash
node scripts/generate-batch-articles.js
```

這個步驟會做的事：

- 只在 `blog/` 中建立缺少的草稿檔案
- 跳過已存在的檔案，作為第一層去重
- 以這批主題的完整 prompt 集合重寫 `data/publishing/batch-prompts-100.json`

## 必須遵守的 Stability AI 圖片 Prompt 流程

所有正式環境的圖片產生都必須使用 Stability AI `v2beta/stable-image/generate/sd3`，模型為 `sd3.5-large-turbo`。

每一個圖片產生任務都必須套用下方固定的 positive prompt wrapper。請將每個圖片任務對應文章的 `coreConcept` / 原始 image prompt 插入 `[CORE_CONCEPT]`，再把完整展開後的 prompt 傳送給 Stability AI。

Positive prompt：

```text
A high-end 3D conceptual editorial illustration representing [CORE_CONCEPT], single unified scene, perfect human anatomy, accurate physics, strict logical structure. Sophisticated modern style, cinematic studio lighting, soft ambient occlusion, smooth textures. Professional harmonious color palette, minimalist uncluttered background, centered clean composition. 8K resolution, masterpiece, ultra-detailed, Unreal Engine 5, Octane Render style, premium corporate aesthetic, trending on ArtStation.
```

Negative prompt：

```text
bad anatomy, extra limbs, missing limbs, mutated hands, poorly drawn face, deformed, ugly, melted faces, floating objects, multiple balls, extra equipment, duplicated items, collage, grid layout, split screen, multiple panels, messy lines, illogical architecture, text, watermark, worst quality, low quality, jpeg artifacts, blurry, out of frame.
```

實作要求：

- `scripts/generate-batch-articles.js` 對新產生的 prompt tasks 必須同時保存 `coreConcept` 與完整包裝後的 `prompt`。
- `scripts/generate-images.js` 必須正規化較舊的 prompt manifest，並把完整包裝後的 positive prompt 加上固定的 negative prompt 傳送給 Stability AI。
- Stability 請求必須使用 multipart form-data，而不是舊版 v1 JSON body。
- Stability 請求必須設定 `model=sd3.5-large-turbo`、`aspect_ratio=16:9` 與 `output_format=webp`。
- `scripts/generate-local-prompt-images.js` 在本地 fallback 產圖前，也必須先正規化較舊的 prompt manifest，同時保留原本的 `coreConcept` 供情境化場景選擇使用。
- 模板不得被重複包裝兩次。如果某個 prompt 已經包裝完成，就直接重用。
- 對於修復批次，必須先建立 task 清單，只產生第一張圖片供人工視覺確認，通過後再跑剩餘任務。

為受影響的 commit 範圍建立修復 task 清單：

```bash
node scripts/build-stability-repair-tasks.js \
  --from-commit <start-commit-sha> \
  --prompts-file data/publishing/batch-prompts-100.json \
  --output data/publishing/stability-repair-02867e8-tasks.json
```

只產生第一張樣本圖片：

```bash
node scripts/generate-images.js \
  --prompts-file data/publishing/stability-repair-02867e8-tasks.json \
  --first-only \
  --overwrite \
  --with-optimized
```

只有在樣本通過確認後，才從第 2 個 task 開始產生剩餘圖片：

```bash
node scripts/generate-images.js \
  --prompts-file data/publishing/stability-repair-02867e8-tasks.json \
  --start 2 \
  --overwrite \
  --with-optimized
```

## 步驟 2：從尚未發布的剩餘草稿建立 Publish Manifest

從目前仍存在於本地、但尚未被 git track 的 prompt-backed 草稿建立 manifest。

```bash
node scripts/build-publish-manifest.js \
  --prompts data/publishing/batch-prompts-100.json \
  --output data/publishing/remaining-batch-selection.json \
  --name remaining-batch
```

預設行為：

- 從 `data/publishing/batch-prompts-100.json` 推導文章 slug
- 對應成 `blog/<slug>.md`
- 只保留本地實際存在的檔案
- 排除已被 git track 的檔案

這個 git-tracked 檢查就是正式發布用的去重層。實務上代表：

- 已經發布過的文章會被跳過
- 已存在且已被 track 的重複稿會被跳過
- manifest 中只會留下仍未發布的本地草稿

常用選項：

```bash
node scripts/build-publish-manifest.js --batch-size 10 --start 0
node scripts/build-publish-manifest.js --batch-size 10 --start 10 --output data/publishing/remaining-batch-2.json
node scripts/build-publish-manifest.js --include-tracked
```

## 步驟 3：先做 Dry Run

在任何圖片產生或 git commit 動作開始前，先精準驗證這次批次到底會跑哪些文章。

```bash
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --dry-run
```

Dry run 會驗證：

- 每篇文章檔案都存在
- 每篇由 prompt 驅動的文章都剛好有 3 個 prompt tasks
- 批次執行器能正確解析所需的產圖與發布步驟

## 步驟 4：批次產生 Stability 圖片並建立依日期切分的本地 Commits

當 dry run 結果正確後，再執行正式批次。這個指令會為每篇文章產生 Stability AI 圖片、最佳化圖片資產、安排文章日期，並建立該文章專屬的本地 commit。它不會 push。

```bash
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json
```

每篇文章會依序發生以下事情：

1. 為該篇文章寫出一份暫時性的 `prompts.json` 子集合
2. 使用 Stability AI `sd3.5-large-turbo` 執行 `scripts/generate-images.js`
3. 套用規定的 positive prompt 模板與固定 negative prompt
4. 產生原始 `.webp` 圖片，以及最佳化後的 `.webp` 與 `.avif` 資產
5. 執行 `scripts/automate-publish.js --no-push`
6. 依照每天最多 2 篇文章的規則安排文章日期
7. 為該文章與其相關資產建立一個本地 commit
8. 刪除暫時性的 `prompts.json`

這個指令是刻意設計成不 push。除非你明確傳入 `--push`，否則批次執行器會把 `--no-push` 傳給 `scripts/automate-publish.js`。標準流程中不要使用 `--push`。

執行器預設可續跑。如果某篇文章已經被 git track，重新執行時會自動跳過。

當所有 commits 完成後，先檢查尚未 push 的本地 commits：

```bash
git --no-pager log --oneline origin/main..HEAD
git status --short --branch
```

只有 repository 擁有者可以在檢查後手動 push：

```bash
git push
```

## 當 Stability 額度不可用時的本地圖片 Fallback

如果 Stability AI 沒有額度，可以從同一份 prompt manifest 在本地產生所需的原始 `.webp` 檔案。

```bash
node scripts/generate-local-prompt-images.js data/publishing/remaining-batch-selection.json
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --skip-image-generation
```

這會建立與原始流程相同的來源檔路徑：

- `assets/blog/<slug>-hero.webp`
- `assets/blog/<slug>-detail.webp`
- `assets/og/og-<slug>.webp`

接著由 `scripts/automate-publish.js` 執行正常的最佳化步驟，產出發布文章所需的最終 `-optimized.webp` 與 `-optimized.avif` 檔案。

若要修復並覆寫某個已發布的 commit 範圍，請直接根據受影響的文章檔案重建原始與最佳化圖片：

```bash
node scripts/generate-local-prompt-images.js \
  --from-commit <start-commit-sha> \
  --prompts-file data/publishing/batch-prompts-100.json \
  --overwrite \
  --with-optimized
```

## 步驟 5：持續分批執行直到清空

當一個批次已經在本地完成 commit 後，再從剩餘未被 track 的草稿建立下一份 manifest。

```bash
node scripts/build-publish-manifest.js \
  --prompts data/publishing/batch-prompts-100.json \
  --output data/publishing/remaining-batch-selection.json \
  --name remaining-batch
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --dry-run
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json
```

重複以上流程，直到 manifest 中沒有任何文章。除非 repository 擁有者明確決定手動 push，否則不要在批次之間 push。

## 既有相容入口

舊的第一批發布指令仍可使用：

```bash
node scripts/publish-first-batch.js
```

它現在會委派給通用的 `scripts/publish-batch.js` 執行器。

## 建議的操作順序

未來批次請固定依照這個順序執行：

1. `node scripts/generate-batch-articles.js`
2. `node scripts/build-publish-manifest.js --output data/publishing/remaining-batch-selection.json --name remaining-batch`
3. `node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --dry-run`
4. `node scripts/publish-batch.js data/publishing/remaining-batch-selection.json`
5. 重複步驟 2 到 4，直到 manifest 為空
6. 使用 `git --no-pager log --oneline origin/main..HEAD` 檢查本地 commits
7. `git push` 只留給 repository 擁有者手動執行

## 備註

- 發布排程仍由 `scripts/automate-publish.js` 負責，並遵守既有的每天最多 2 篇文章規則。
- 這套流程做的是 slug / 檔案層級去重，不是語意主題層級去重。
- manifest 檔案可隨時安全重建，因為它是根據目前檔案系統狀態與 git tracked 狀態推導出來的。
- `scripts/publish-batch.js` 預設只建立本地 commits。自動 push 必須明確傳入 `--push`，而這不屬於本 SOP 的標準流程。