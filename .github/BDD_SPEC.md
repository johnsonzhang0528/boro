# Boro Jeet 聯盟行銷網站 - BDD 規格說明書

## 1. 專案概覽
本專案是一個針對孟加拉市場 (`bn-BD`) 的 **Boro Jeet** 聯盟行銷計畫的高效能、SEO 優化靜態網站。該網站使用 **Eleventy (11ty)** 建置，專注於應用程式下載、遊戲策略（Crash、老虎機）以及登入疑難排解。

## 2. 技術堆疊
- **核心**: Node.js, Eleventy v2+
- **模板引擎**: Nunjucks (`.njk`)
- **內容**: Markdown (`.md`)
- **樣式**: 自定義 CSS (Utility-first, 透過 `esbuild` 壓縮)
- **圖片**: 透過 Sharp & `@11ty/eleventy-img` 優化為 `.webp`/`.avif`
- **部署**: Vercel

---

## 3. 功能規格 (Feature Specifications)

### 功能：內容管理與發布 (Content Management & Publishing)

**場景：撰寫新的部落格文章**
  **假設 (Given)** 我是內容編輯者
  **當 (When)** 我在 `blog/` 目錄下建立一個新的 Markdown 檔案
  **那麼 (Then)** frontmatter 必須包含 `layout: post.njk`
  **並且 (And)** `lang` 屬性應預設為 `bn-BD`
  **並且 (And)** 我必須提供唯一的 `title` 和符合 SEO 的 `description` (150-160 字元)
  **並且 (And)** 我應該指定 `tags` 進行分類
  **並且 (And)** 我可以選擇性地加入 `faq` 陣列以生成結構化資料

**場景：解決關鍵字蠶食 (Resolving Keyword Cannibalization)**
  **假設 (Given)** 我已寫好一篇新文章
  **當 (When)** 我執行 `node scripts/check-cannibalization.js`
  **那麼 (Then)** 系統應分析新標題與現有標題之間的 Jaccard 相似度 (Jaccard Similarity)
  **並且 (And)** 如果相似度超過 60%，系統應警告我潛在的蠶食風險
  **並且 (And)** 如果發現衝突，我應該重新命名或調整內容目標

**場景：自動化內容發布 (Automating Content Publishing)**
  **假設 (Given)** 我已準備好草稿文章
  **當 (When)** 我執行 `npm run publish:new-post <檔名>`
  **那麼 (Then)** 系統應將所有引用的圖片優化為 `.webp` 和 `.avif`
  **並且 (And)** 系統應更新 Markdown 內容中的圖片路徑
  **並且 (And)** 系統應將 `lastUpdated` 設定為當前日期

---

### 功能：SEO 與中繼資料策略 (SEO & Metadata Strategy)

**場景：品牌意圖優化 (首頁)**
  **假設 (Given)** 使用者搜尋 "Boro Jeet Login" 或 "App Download"
  **當 (When)** 他們訪問首頁
  **那麼 (Then)** `<title>` 標籤應包含 "Login Help" 和 "App Download"
  **並且 (And)** `<h1>` 標籤應清楚說明 "Official App Download & Login Guide"
  **並且 (And)** meta description 應提及登入問題解決和儲值協助 (bKash/Nagad)

**場景：處理過期內容 (年份更新)**
  **假設 (Given)** 現在是新的一年 (例如 2026 年)
  **當 (When)** 我更新一篇 "Best of [Year]" 的指南文章
  **那麼 (Then)** 我必須重新命名檔案 (例如 `2025` -> `2026`)
  **並且 (And)** 我必須在 `vercel.json` 中新增 **301 Redirect (永久重定向)**，將舊網址指向新網址
  **並且 (And)** 我必須更新內容標題與 frontmatter 日期

**場景：結構化資料標記 (Schema Markup)**
  **假設 (Given)** 頁面具有 `softwareApp` frontmatter
  **當 (When)** 頁面渲染時
  **那麼 (Then)** 應在 `<head>` 中生成 JSON-LD `SoftwareApplication` schema
  **假設 (Given)** 頁面具有 `faq` frontmatter
  **當 (When)** 頁面渲染時
  **那麼 (Then)** 應生成 JSON-LD `FAQPage` schema

---

### 功能：圖片優化與視覺 (Image Optimization & Visuals)

**場景：響應式圖片渲染**
  **假設 (Given)** Markdown 檔案包含圖片
  **當 (When)** 網站建置時
  **那麼 (Then)** 圖片應使用 `<picture>` 標籤渲染
  **並且 (And)** 應包含 `image/avif` 和 `image/webp` 的 `<source>` 元素
  **並且 (And)** 後備的 `<img>` 標籤必須具有 `width`, `height`, `loading="lazy"`, 和 `decoding="async"` 屬性 (LCP 圖片除外，應使用 `fetchpriority="high"`)

**場景：AI 圖片生成**
  **假設 (Given)** 我需要一張獨特的精選圖片
  **當 (When)** 我在 `prompts.json` 定義提示詞並執行 `node scripts/generate-images.js`
  **那麼 (Then)** 系統應呼叫 Stability AI API
  **並且 (And)** 系統應將原始生成的圖片存入 `assets/`
  **並且 (And)** 系統應自動將其轉換為優化格式

---

### 功能：在地化 (bn-BD)

**場景：預設語言設定**
  **假設 (Given)** 使用者訪問任何頁面
  **當 (When)** HTML 渲染時
  **那麼 (Then)** `<html>` 標籤應具有 `lang="bn-BD"` (除非被覆寫)
  **並且 (And)** 日期格式應符合當地習慣 (如已實作相關格式化字串)

---

### 功能：效能 (Performance)

**場景：關鍵 CSS (Critical CSS)**
  **假設 (Given)** 網站正在載入
  **那麼 (Then)** 關鍵樣式 (顏色、基本佈局) 應該內嵌於 `base.njk` 以防止 FOUC/CLS
  **並且 (And)** 主樣式表應非同步載入或置於 body 尾部 (如果不具關鍵性)

**場景：腳本管理**
  **假設 (Given)** 需要大量 JS (例如追蹤器、輪播圖)
  **當 (When)** 頁面載入時
  **那麼 (Then)** 繁重的腳本應被延遲載入 (defer) 或懶加載 (`universal-performance.js`)

---

## 4. 目錄結構標準

- `_data/`: 全域資料 (網站中繼資料、促銷活動)。
- `_includes/`: 模板 (`base.njk`, `post.njk`)。
- `blog/`: 部落格文章來源 Markdown 檔案。
- `assets/`:
    - `blog/`: 文章專用圖片。
    - `og/`: Open Graph 圖片。
- `scripts/`: 維護與自動化腳本。
- `_site/`: 建置輸出 (Gitignored)。

