# Boro 批次發布工作流程

這是一套可重複執行的端到端流程，用於處理 `前期分析與規劃 -> 現有內容優化與內鏈策略 -> 批次產生草稿 -> 新文章撰寫與實作 -> 去重 -> 建立 manifest -> 批次產生 Stability AI 圖片 -> 依日期建立本地 commit -> 手動 push`。

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

## 流程總覽

1. 盤點全站既有內容並完成主題規劃。
2. 規劃並執行現有文章優化與內部連結調整。
3. 批次產生缺少的草稿。
4. 逐篇完成新文章的 SEO、內容、語言與內鏈實作。
5. 建立 publish manifest 並做 dry run。
6. 批次產生 Stability AI 圖片，建立本地 commits。
7. 分批續跑直到 manifest 清空。
8. 完成本地驗證後，由 repository 擁有者手動 push。

## 步驟 1：前期分析與規劃

在建立任何新草稿之前，必須先對現有內容做完整盤點，避免重複主題並建立清楚的內容集群結構。

- 完整列出並閱讀 `blog/` 目錄下所有 `.md` 文章。
- 分析現有主題，找出可延伸的內容集群（Content Clusters）與主題孤島（Content Silos）。
- 基於分析結果提出 1 到 3 個最具 SEO 價值的新主題。
- 新主題必須與既有內容相關，但不能重複；目標是補足知識缺口，或從不同角度深入既有主題。
- 在規劃新主題時，先決定它所屬的 Pillar-Cluster 關係：
  - Pillar Page：某一核心主題的全面型、權威型長文。
  - Cluster Content：圍繞該主題的子議題文章。
- 連結方向必須預先定義：
  - 所有 Cluster Content 都應連回對應的 Pillar Page。
  - Pillar Page 也應連向相關 Cluster Content。
  - 相近的 Cluster Content 之間可互相連結。
- 主題送交專案負責人確認後，才能進入批次草稿與寫作流程。

## 步驟 2：現有內容優化與全站內鏈策略

在撰寫新文章前，先強化既有文章的結構與內鏈網路，確保新文一上線就能被整體內容體系支撐。

### 2.1 目標

- 提升 SEO 表現，讓搜尋引擎更容易理解頁面層級與主題關聯。
- 傳遞頁面權重，讓高價值頁面把連結權益分配給重要文章。
- 增加頁面停留時間，降低跳出率。
- 降低孤島頁面數量，確保重要文章可被站內發現與索引。

### 2.2 盤點與優化原則

- 逐篇檢查 `blog/` 下文章，找出可以自然連到「即將撰寫的新文章」或既有核心文章的位置。
- 若某次調整只是新增或優化內部連結，**不要**修改 `lastUpdated`。只有文章內容實質更新時才更新此欄位。
- 檢查被調整文章的 Front Matter 是否具備必要 SEO 欄位。
- 若文章包含 FAQ，請改放在 Front Matter 的 `faq` 區塊，而不是內文手寫 FAQ 段落。
- 若文章屬於教學型內容，請使用 Front Matter 的 `howto` 區塊定義步驟。

### 2.3 執行內部連結規劃

- 先找出每個核心主題的 Pillar Page。
- 為每篇新文章或既有核心頁面整理一組搜尋關鍵字與同義詞。
- 在整個 `blog/` 目錄中搜索這些關鍵字，找出最適合插入連結的上下文段落。
- 錨點文字必須具描述性，且與目標頁內容高度相關。
- 不同文章中應適度變化錨點文字，避免所有連結都使用完全相同的字串。
- 連結必須放在語意自然、對讀者有幫助的段落中，不可硬塞。
- 使用標準 Markdown 連結格式：`[錨點文字](/blog/target-article-slug/)`。
- 一篇約 1000 字的文章，5 到 10 個自然且相關的內部連結屬於合理密度；避免過度堆砌。
- 優先讓最重要的 Pillar Pages 獲得更多內鏈支持。
- 避免建立沒有意義的短循環，例如 A -> B -> A。
- 若有需要，也可補入指向權威外部網站的連結，但必須符合站上外部連結規範。

### 2.4 處理孤島頁面

- 每完成一輪內鏈建設後，找出沒有任何站內連結指向的文章。
- 優先從最相關的既有文章中，至少補上一條指向該頁的內部連結。

## 步驟 3：批次產生草稿

當主題規劃完成後，使用產生器建立缺少的批次草稿。

```bash
node scripts/generate-batch-articles.js
```

這個步驟會做的事：

- 只在 `blog/` 中建立缺少的草稿檔案。
- 跳過已存在的檔案，作為第一層去重。
- 以這批主題的完整 prompt 集合重寫 `data/publishing/batch-prompts-100.json`。

## 步驟 4：新文章撰寫與實作

不論草稿是人工建立還是由 `scripts/generate-batch-articles.js` 產生，在進入 publish manifest 前，都必須逐篇完成以下要求。

### 4.1 檔案與 Front Matter 規範

- 檔名應使用全小寫英文，並用連字號 `-` 分隔單字，準確描述文章主題。
- Front Matter 建議依下列順序整理：
  - `layout`：通常為 `post.njk`。
  - `lang`：例如 `bn-BD`。
  - `title`：以孟加拉語為主，保留必要英文關鍵字。
  - `description`：以孟加拉語為主，保留必要英文關鍵字，並包含主要關鍵字。
  - `date`：文章建立日期。
  - `lastUpdated`：文章最後更新日期。
  - `ogImage`：Open Graph 圖片檔名，不包含路徑。
  - `ogImageAlt`：以孟加拉語為主，保留必要英文關鍵字。
  - `tags`：必須包含 `post`，其餘標籤須與內容主題相符。
  - `review`：適用於評測、比較或推薦清單時才填寫。
  - `faq`：若文章含常見問題，請放在 Front Matter。
  - `howto`：若文章屬於教學型內容，請放在 Front Matter。

### 4.2 內容撰寫規則

- 若文章提及註冊或下載 App，必須引導使用者先在網站完成註冊，再下載 App，以避免 affiliate tracking 遺失。
- 可使用的標準話術：`Register on the website first to claim your bonus, then download the app for the best experience.`
- 所有指向外部網站或聯盟導流頁的連結，例如 `/go/borojeet`，都必須包含 `rel="sponsored nofollow"` 與 `target="_blank"`。
- 禁止在內文手動加入 `<h1>`，模板會自動處理。
- 禁止在內文手動加入 `<script type="application/ld+json">`，結構化資料由模板根據 Front Matter 自動產生。
- 第一段導言應使用 `<p class="lead">`。
- 若文章手動插入首圖，請使用 `<picture>` 並加上 `data-critical="true"` 以優化 LCP。
- 文章整體語氣需與既有文章一致。
- 內容中的遊戲名稱、供應商、規則與產品資訊必須再次對照 `borojeet.com` 確認正確性。

### 4.3 語言策略

- 正文段落、規則說明與策略分析以孟加拉語為主。
- 保留必要英文術語，並自然融入孟加拉語句子中，不要寫成中英逐句對照。
- 標題可採孟加拉語為主，搭配英文關鍵字。
- 不得出現中文或其他不相干語言。
- FAQ 與 HowTo 內容也必須符合相同語言策略。

### 4.4 新文章內鏈要求

- 每篇新文章內至少自然加入 2 到 3 個指向其他相關文章的內部連結。
- 新文章必須連回對應的 Pillar Page。
- 若主題相關，Pillar Page 或其他舊文也必須補上回鏈到這篇新文章。

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

## 步驟 5：從尚未發布的剩餘草稿建立 Publish Manifest

從目前仍存在於本地、但尚未被 git track 的 prompt-backed 草稿建立 manifest。

```bash
node scripts/build-publish-manifest.js \
  --prompts data/publishing/batch-prompts-100.json \
  --output data/publishing/remaining-batch-selection.json \
  --name remaining-batch
```

預設行為：

- 從 `data/publishing/batch-prompts-100.json` 推導文章 slug。
- 對應成 `blog/<slug>.md`。
- 只保留本地實際存在的檔案。
- 排除已被 git track 的檔案。

這個 git-tracked 檢查就是正式發布用的去重層。實務上代表：

- 已經發布過的文章會被跳過。
- 已存在且已被 track 的重複稿會被跳過。
- manifest 中只會留下仍未發布的本地草稿。

常用選項：

```bash
node scripts/build-publish-manifest.js --batch-size 10 --start 0
node scripts/build-publish-manifest.js --batch-size 10 --start 10 --output data/publishing/remaining-batch-2.json
node scripts/build-publish-manifest.js --include-tracked
```

## 步驟 6：先做 Dry Run

在任何圖片產生或 git commit 動作開始前，先精準驗證這次批次到底會跑哪些文章。

```bash
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --dry-run
```

Dry run 會驗證：

- 每篇文章檔案都存在。
- 每篇由 prompt 驅動的文章都剛好有 3 個 prompt tasks。
- 批次執行器能正確解析所需的產圖與發布步驟。

## 步驟 7：批次產生 Stability 圖片並建立依日期切分的本地 Commits

當 dry run 結果正確後，再執行正式批次。這個指令會為每篇文章產生 Stability AI 圖片、最佳化圖片資產、安排文章日期，並建立該文章專屬的本地 commit。它不會 push。

```bash
node scripts/publish-batch.js data/publishing/remaining-batch-selection.json
```

每篇文章會依序發生以下事情：

1. 為該篇文章寫出一份暫時性的 `prompts.json` 子集合。
2. 使用 Stability AI `sd3.5-large-turbo` 執行 `scripts/generate-images.js`。
3. 套用規定的 positive prompt 模板與固定 negative prompt。
4. 產生原始 `.webp` 圖片，以及最佳化後的 `.webp` 與 `.avif` 資產。
5. 執行 `scripts/automate-publish.js --no-push`。
6. 依照每天最多 2 篇文章的規則安排文章日期。
7. 為該文章與其相關資產建立一個本地 commit。
8. 刪除暫時性的 `prompts.json`。

這個指令是刻意設計成不 push。除非你明確傳入 `--push`，否則批次執行器會把 `--no-push` 傳給 `scripts/automate-publish.js`。標準流程中不要使用 `--push`。

執行器預設可續跑。如果某篇文章已經被 git track，重新執行時會自動跳過。

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

## 步驟 8：持續分批執行直到清空

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

## 步驟 9：內鏈與發布後驗證

在所有文章與內鏈調整完成後，必須做一次站內驗證，確保寫作規範、連結結構與輸出結果一致。

### 9.1 本地驗證

```bash
npx @11ty/eleventy --serve
```

- 瀏覽所有被修改過的頁面與新發布頁面。
- 點擊每一個新增或調整過的內部連結，確認沒有導向 404。
- 確認每個內鏈都指向正確目標文章，且錨點文字與段落語意自然。
- 檢查 Pillar Page 與 Cluster Content 之間的回鏈是否完整。
- 再次檢查孤島頁面是否已補上至少一條站內連結。

### 9.2 Git 檢查與手動 Push

當所有 commits 完成後，先檢查尚未 push 的本地 commits：

```bash
git --no-pager log --oneline origin/main..HEAD
git status --short --branch
```

只有 repository 擁有者可以在檢查後手動 push：

```bash
git push
```

## 既有相容入口

舊的第一批發布指令仍可使用：

```bash
node scripts/publish-first-batch.js
```

它現在會委派給通用的 `scripts/publish-batch.js` 執行器。

## 建議的操作順序

未來批次請固定依照這個順序執行：

1. 盤點 `blog/` 既有內容，整理主題集群與 Pillar-Cluster 關係。
2. 先在既有文章中規劃並補上必要的內部連結機會。
3. `node scripts/generate-batch-articles.js`
4. 逐篇完善新草稿的 Front Matter、語言策略、內文、FAQ / HowTo 與內鏈。
5. `node scripts/build-publish-manifest.js --output data/publishing/remaining-batch-selection.json --name remaining-batch`
6. `node scripts/publish-batch.js data/publishing/remaining-batch-selection.json --dry-run`
7. `node scripts/publish-batch.js data/publishing/remaining-batch-selection.json`
8. 重複步驟 5 到 7，直到 manifest 為空。
9. `npx @11ty/eleventy --serve` 驗證所有修改過頁面的內鏈與輸出。
10. 使用 `git --no-pager log --oneline origin/main..HEAD` 檢查本地 commits。
11. `git push` 只留給 repository 擁有者手動執行。

## 備註

- 發布排程仍由 `scripts/automate-publish.js` 負責，並遵守既有的每天最多 2 篇文章規則。
- 這套流程做的是 slug / 檔案層級去重，不是語意主題層級去重。
- manifest 檔案可隨時安全重建，因為它是根據目前檔案系統狀態與 git tracked 狀態推導出來的。
- `scripts/publish-batch.js` 預設只建立本地 commits。自動 push 必須明確傳入 `--push`，而這不屬於本 SOP 的標準流程。
- 內部連結優化不是一次性工作。每次新增文章後，都應回頭檢查是否要補連到既有文章，或由既有文章補回鏈到新文。