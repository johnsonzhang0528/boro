# fal.ai Flux 圖片完成紀錄

更新日期：2026-05-03

## 目前狀態

- 圖片任務總數：300 張來源圖
- 前次已完成：250 張來源圖（含最佳化衍生檔共 750 個檔案）
- 本次使用 fal.ai Flux 2 完成：50 張來源圖（含最佳化衍生檔共 150 個檔案）
- 尚未完成：0 張來源圖
- 本次腳本：`scripts/generate-fal-flux-images.js`
- API key 來源：`.env` 的 `FAL_AI_API_KEY`
- 實際可用模型：`fal-ai/flux-2-flex`（目前 fal.ai 可用並已驗證的 Flux 2 text-to-image endpoint；若帳號開通 Dev Turbo endpoint，可用 `FAL_FLUX_MODEL` 覆寫）
- API 端每個 prompt 只產生 1 張圖；source `.webp` 與 `-optimized.webp` / `-optimized.avif` 均由本地 `sharp` 轉檔與最佳化。

## 若需重新覆寫本批圖片

```bash
node scripts/generate-fal-flux-images.js \
  --prompts-file data/publishing/gsc-expansion-2026-05-prompts.json \
  --image-md image.md \
  --overwrite
```

## 已完成圖片明細（原未完成清單）

| 任務索引 | 文章 Slug | 圖片類型 | 檔案 | Core Concept |
|---:|---|---|---|---|
| 251 | betting-app-with-bkash-nagad-bd | Detail/body image | assets/blog/betting-app-with-bkash-nagad-bd-detail.webp | Betting App with bKash Nagad BD, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 252 | betting-app-with-bkash-nagad-bd | OG social image | assets/og/og-betting-app-with-bkash-nagad-bd.webp | Betting App with bKash Nagad BD, wide social sharing composition with one central symbolic object and clean negative space |
| 253 | betting-app-login-problems-fix-bangladesh | Hero image | assets/blog/betting-app-login-problems-fix-bangladesh-hero.webp | Betting App Login Problems Fix Bangladesh, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 254 | betting-app-login-problems-fix-bangladesh | Detail/body image | assets/blog/betting-app-login-problems-fix-bangladesh-detail.webp | Betting App Login Problems Fix Bangladesh, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 255 | betting-app-login-problems-fix-bangladesh | OG social image | assets/og/og-betting-app-login-problems-fix-bangladesh.webp | Betting App Login Problems Fix Bangladesh, wide social sharing composition with one central symbolic object and clean negative space |
| 256 | new-betting-apps-2026-bangladesh | Hero image | assets/blog/new-betting-apps-2026-bangladesh-hero.webp | New Betting Apps 2026 Bangladesh, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 257 | new-betting-apps-2026-bangladesh | Detail/body image | assets/blog/new-betting-apps-2026-bangladesh-detail.webp | New Betting Apps 2026 Bangladesh, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 258 | new-betting-apps-2026-bangladesh | OG social image | assets/og/og-new-betting-apps-2026-bangladesh.webp | New Betting Apps 2026 Bangladesh, wide social sharing composition with one central symbolic object and clean negative space |
| 259 | betting-app-bd-low-deposit-guide | Hero image | assets/blog/betting-app-bd-low-deposit-guide-hero.webp | Betting App BD Low Deposit Guide, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 260 | betting-app-bd-low-deposit-guide | Detail/body image | assets/blog/betting-app-bd-low-deposit-guide-detail.webp | Betting App BD Low Deposit Guide, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 261 | betting-app-bd-low-deposit-guide | OG social image | assets/og/og-betting-app-bd-low-deposit-guide.webp | Betting App BD Low Deposit Guide, wide social sharing composition with one central symbolic object and clean negative space |
| 262 | international-betting-apps-bangladesh-guide | Hero image | assets/blog/international-betting-apps-bangladesh-guide-hero.webp | International Betting Apps Bangladesh Guide, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 263 | international-betting-apps-bangladesh-guide | Detail/body image | assets/blog/international-betting-apps-bangladesh-guide-detail.webp | International Betting Apps Bangladesh Guide, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 264 | international-betting-apps-bangladesh-guide | OG social image | assets/og/og-international-betting-apps-bangladesh-guide.webp | International Betting Apps Bangladesh Guide, wide social sharing composition with one central symbolic object and clean negative space |
| 265 | betting-apps-list-bangladesh | Hero image | assets/blog/betting-apps-list-bangladesh-hero.webp | Betting Apps List Bangladesh, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 266 | betting-apps-list-bangladesh | Detail/body image | assets/blog/betting-apps-list-bangladesh-detail.webp | Betting Apps List Bangladesh, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 267 | betting-apps-list-bangladesh | OG social image | assets/og/og-betting-apps-list-bangladesh.webp | Betting Apps List Bangladesh, wide social sharing composition with one central symbolic object and clean negative space |
| 268 | top-betting-sites-cricket-bangladesh | Hero image | assets/blog/top-betting-sites-cricket-bangladesh-hero.webp | Top Betting Sites for Cricket Bangladesh, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 269 | top-betting-sites-cricket-bangladesh | Detail/body image | assets/blog/top-betting-sites-cricket-bangladesh-detail.webp | Top Betting Sites for Cricket Bangladesh, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 270 | top-betting-sites-cricket-bangladesh | OG social image | assets/og/og-top-betting-sites-cricket-bangladesh.webp | Top Betting Sites for Cricket Bangladesh, wide social sharing composition with one central symbolic object and clean negative space |
| 271 | wagering-requirements-meaning-bangla | Hero image | assets/blog/wagering-requirements-meaning-bangla-hero.webp | Wagering Requirements Meaning Bangla, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 272 | wagering-requirements-meaning-bangla | Detail/body image | assets/blog/wagering-requirements-meaning-bangla-detail.webp | Wagering Requirements Meaning Bangla, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 273 | wagering-requirements-meaning-bangla | OG social image | assets/og/og-wagering-requirements-meaning-bangla.webp | Wagering Requirements Meaning Bangla, wide social sharing composition with one central symbolic object and clean negative space |
| 274 | wagering-requirement-bonus-guide-bd | Hero image | assets/blog/wagering-requirement-bonus-guide-bd-hero.webp | Wagering Requirement Bonus Guide BD, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 275 | wagering-requirement-bonus-guide-bd | Detail/body image | assets/blog/wagering-requirement-bonus-guide-bd-detail.webp | Wagering Requirement Bonus Guide BD, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 276 | wagering-requirement-bonus-guide-bd | OG social image | assets/og/og-wagering-requirement-bonus-guide-bd.webp | Wagering Requirement Bonus Guide BD, wide social sharing composition with one central symbolic object and clean negative space |
| 277 | bonus-turnover-calculation-bangladesh | Hero image | assets/blog/bonus-turnover-calculation-bangladesh-hero.webp | Bonus Turnover Calculation Bangladesh, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 278 | bonus-turnover-calculation-bangladesh | Detail/body image | assets/blog/bonus-turnover-calculation-bangladesh-detail.webp | Bonus Turnover Calculation Bangladesh, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 279 | bonus-turnover-calculation-bangladesh | OG social image | assets/og/og-bonus-turnover-calculation-bangladesh.webp | Bonus Turnover Calculation Bangladesh, wide social sharing composition with one central symbolic object and clean negative space |
| 280 | daily-betting-rebate-guide-bangladesh | Hero image | assets/blog/daily-betting-rebate-guide-bangladesh-hero.webp | Daily Betting Rebate Guide Bangladesh, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 281 | daily-betting-rebate-guide-bangladesh | Detail/body image | assets/blog/daily-betting-rebate-guide-bangladesh-detail.webp | Daily Betting Rebate Guide Bangladesh, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 282 | daily-betting-rebate-guide-bangladesh | OG social image | assets/og/og-daily-betting-rebate-guide-bangladesh.webp | Daily Betting Rebate Guide Bangladesh, wide social sharing composition with one central symbolic object and clean negative space |
| 283 | free-bonus-without-deposit-bd-guide | Hero image | assets/blog/free-bonus-without-deposit-bd-guide-hero.webp | Free Bonus Without Deposit BD Guide, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 284 | free-bonus-without-deposit-bd-guide | Detail/body image | assets/blog/free-bonus-without-deposit-bd-guide-detail.webp | Free Bonus Without Deposit BD Guide, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 285 | free-bonus-without-deposit-bd-guide | OG social image | assets/og/og-free-bonus-without-deposit-bd-guide.webp | Free Bonus Without Deposit BD Guide, wide social sharing composition with one central symbolic object and clean negative space |
| 286 | borojeet-casino-login-guide | Hero image | assets/blog/borojeet-casino-login-guide-hero.webp | BoroJeet Casino Login Guide, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 287 | borojeet-casino-login-guide | Detail/body image | assets/blog/borojeet-casino-login-guide-detail.webp | BoroJeet Casino Login Guide, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 288 | borojeet-casino-login-guide | OG social image | assets/og/og-borojeet-casino-login-guide.webp | BoroJeet Casino Login Guide, wide social sharing composition with one central symbolic object and clean negative space |
| 289 | borojeet-vip-bonus-rules-bangla | Hero image | assets/blog/borojeet-vip-bonus-rules-bangla-hero.webp | BoroJeet VIP Bonus Rules Bangla, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 290 | borojeet-vip-bonus-rules-bangla | Detail/body image | assets/blog/borojeet-vip-bonus-rules-bangla-detail.webp | BoroJeet VIP Bonus Rules Bangla, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 291 | borojeet-vip-bonus-rules-bangla | OG social image | assets/og/og-borojeet-vip-bonus-rules-bangla.webp | BoroJeet VIP Bonus Rules Bangla, wide social sharing composition with one central symbolic object and clean negative space |
| 292 | online-betting-legal-bangladesh-explained | Hero image | assets/blog/online-betting-legal-bangladesh-explained-hero.webp | Online Betting Legal Bangladesh Explained, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 293 | online-betting-legal-bangladesh-explained | Detail/body image | assets/blog/online-betting-legal-bangladesh-explained-detail.webp | Online Betting Legal Bangladesh Explained, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 294 | online-betting-legal-bangladesh-explained | OG social image | assets/og/og-online-betting-legal-bangladesh-explained.webp | Online Betting Legal Bangladesh Explained, wide social sharing composition with one central symbolic object and clean negative space |
| 295 | is-online-gambling-legal-in-bangladesh-guide | Hero image | assets/blog/is-online-gambling-legal-in-bangladesh-guide-hero.webp | Is Online Gambling Legal in Bangladesh, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 296 | is-online-gambling-legal-in-bangladesh-guide | Detail/body image | assets/blog/is-online-gambling-legal-in-bangladesh-guide-detail.webp | Is Online Gambling Legal in Bangladesh, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 297 | is-online-gambling-legal-in-bangladesh-guide | OG social image | assets/og/og-is-online-gambling-legal-in-bangladesh-guide.webp | Is Online Gambling Legal in Bangladesh, wide social sharing composition with one central symbolic object and clean negative space |
| 298 | fake-betting-apps-bangladesh-warning | Hero image | assets/blog/fake-betting-apps-bangladesh-warning-hero.webp | Fake Betting Apps Bangladesh Warning, premium editorial hero scene for Bangladesh online betting search intent, central symbolic smartphone and analytics dashboard |
| 299 | fake-betting-apps-bangladesh-warning | Detail/body image | assets/blog/fake-betting-apps-bangladesh-warning-detail.webp | Fake Betting Apps Bangladesh Warning, close-up decision checklist interface with safe payment, odds, and risk-control visual elements |
| 300 | fake-betting-apps-bangladesh-warning | OG social image | assets/og/og-fake-betting-apps-bangladesh-warning.webp | Fake Betting Apps Bangladesh Warning, wide social sharing composition with one central symbolic object and clean negative space |

## 依文章分組（已完成）

### betting-app-with-bkash-nagad-bd

- 未完成任務索引：251, 252
- Detail/body image：assets/blog/betting-app-with-bkash-nagad-bd-detail.webp
- OG social image：assets/og/og-betting-app-with-bkash-nagad-bd.webp

### betting-app-login-problems-fix-bangladesh

- 未完成任務索引：253, 254, 255
- Hero image：assets/blog/betting-app-login-problems-fix-bangladesh-hero.webp
- Detail/body image：assets/blog/betting-app-login-problems-fix-bangladesh-detail.webp
- OG social image：assets/og/og-betting-app-login-problems-fix-bangladesh.webp

### new-betting-apps-2026-bangladesh

- 未完成任務索引：256, 257, 258
- Hero image：assets/blog/new-betting-apps-2026-bangladesh-hero.webp
- Detail/body image：assets/blog/new-betting-apps-2026-bangladesh-detail.webp
- OG social image：assets/og/og-new-betting-apps-2026-bangladesh.webp

### betting-app-bd-low-deposit-guide

- 未完成任務索引：259, 260, 261
- Hero image：assets/blog/betting-app-bd-low-deposit-guide-hero.webp
- Detail/body image：assets/blog/betting-app-bd-low-deposit-guide-detail.webp
- OG social image：assets/og/og-betting-app-bd-low-deposit-guide.webp

### international-betting-apps-bangladesh-guide

- 未完成任務索引：262, 263, 264
- Hero image：assets/blog/international-betting-apps-bangladesh-guide-hero.webp
- Detail/body image：assets/blog/international-betting-apps-bangladesh-guide-detail.webp
- OG social image：assets/og/og-international-betting-apps-bangladesh-guide.webp

### betting-apps-list-bangladesh

- 未完成任務索引：265, 266, 267
- Hero image：assets/blog/betting-apps-list-bangladesh-hero.webp
- Detail/body image：assets/blog/betting-apps-list-bangladesh-detail.webp
- OG social image：assets/og/og-betting-apps-list-bangladesh.webp

### top-betting-sites-cricket-bangladesh

- 未完成任務索引：268, 269, 270
- Hero image：assets/blog/top-betting-sites-cricket-bangladesh-hero.webp
- Detail/body image：assets/blog/top-betting-sites-cricket-bangladesh-detail.webp
- OG social image：assets/og/og-top-betting-sites-cricket-bangladesh.webp

### wagering-requirements-meaning-bangla

- 未完成任務索引：271, 272, 273
- Hero image：assets/blog/wagering-requirements-meaning-bangla-hero.webp
- Detail/body image：assets/blog/wagering-requirements-meaning-bangla-detail.webp
- OG social image：assets/og/og-wagering-requirements-meaning-bangla.webp

### wagering-requirement-bonus-guide-bd

- 未完成任務索引：274, 275, 276
- Hero image：assets/blog/wagering-requirement-bonus-guide-bd-hero.webp
- Detail/body image：assets/blog/wagering-requirement-bonus-guide-bd-detail.webp
- OG social image：assets/og/og-wagering-requirement-bonus-guide-bd.webp

### bonus-turnover-calculation-bangladesh

- 未完成任務索引：277, 278, 279
- Hero image：assets/blog/bonus-turnover-calculation-bangladesh-hero.webp
- Detail/body image：assets/blog/bonus-turnover-calculation-bangladesh-detail.webp
- OG social image：assets/og/og-bonus-turnover-calculation-bangladesh.webp

### daily-betting-rebate-guide-bangladesh

- 未完成任務索引：280, 281, 282
- Hero image：assets/blog/daily-betting-rebate-guide-bangladesh-hero.webp
- Detail/body image：assets/blog/daily-betting-rebate-guide-bangladesh-detail.webp
- OG social image：assets/og/og-daily-betting-rebate-guide-bangladesh.webp

### free-bonus-without-deposit-bd-guide

- 未完成任務索引：283, 284, 285
- Hero image：assets/blog/free-bonus-without-deposit-bd-guide-hero.webp
- Detail/body image：assets/blog/free-bonus-without-deposit-bd-guide-detail.webp
- OG social image：assets/og/og-free-bonus-without-deposit-bd-guide.webp

### borojeet-casino-login-guide

- 未完成任務索引：286, 287, 288
- Hero image：assets/blog/borojeet-casino-login-guide-hero.webp
- Detail/body image：assets/blog/borojeet-casino-login-guide-detail.webp
- OG social image：assets/og/og-borojeet-casino-login-guide.webp

### borojeet-vip-bonus-rules-bangla

- 未完成任務索引：289, 290, 291
- Hero image：assets/blog/borojeet-vip-bonus-rules-bangla-hero.webp
- Detail/body image：assets/blog/borojeet-vip-bonus-rules-bangla-detail.webp
- OG social image：assets/og/og-borojeet-vip-bonus-rules-bangla.webp

### online-betting-legal-bangladesh-explained

- 未完成任務索引：292, 293, 294
- Hero image：assets/blog/online-betting-legal-bangladesh-explained-hero.webp
- Detail/body image：assets/blog/online-betting-legal-bangladesh-explained-detail.webp
- OG social image：assets/og/og-online-betting-legal-bangladesh-explained.webp

### is-online-gambling-legal-in-bangladesh-guide

- 未完成任務索引：295, 296, 297
- Hero image：assets/blog/is-online-gambling-legal-in-bangladesh-guide-hero.webp
- Detail/body image：assets/blog/is-online-gambling-legal-in-bangladesh-guide-detail.webp
- OG social image：assets/og/og-is-online-gambling-legal-in-bangladesh-guide.webp

### fake-betting-apps-bangladesh-warning

- 未完成任務索引：298, 299, 300
- Hero image：assets/blog/fake-betting-apps-bangladesh-warning-hero.webp
- Detail/body image：assets/blog/fake-betting-apps-bangladesh-warning-detail.webp
- OG social image：assets/og/og-fake-betting-apps-bangladesh-warning.webp
