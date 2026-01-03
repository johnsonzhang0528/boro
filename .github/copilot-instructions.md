# GitHub Copilot Instructions for BoroJeet Affiliate Site

This repository is a static site built with **Eleventy (11ty)**, using **Nunjucks** templates and **Markdown** for content. It focuses on high performance, SEO, and accessibility for the Bangladeshi market.

## 🏗 Project Architecture

- **Framework**: Eleventy v2.0+
- **Templating**: Nunjucks (`.njk`)
- **Content**: Markdown (`.md`) in `blog/`, `promotions/`, and root.
- **Styling**: Custom CSS (`assets/style.css`) bundled/minified via `esbuild`.
- **Images**: Optimized via `@11ty/eleventy-img` and custom scripts.
- **Timezone**: Asia/Dhaka (GMT+6).

### Key Directories
- `_includes/`: Nunjucks layouts (`base.njk`, `post.njk`) and partials.
- `_data/`: Global data files (`site.js`, `promotions.js`).
- `assets/`: Raw static assets (CSS, JS, images).
- `blog/`: Blog posts (Markdown).
- `scripts/`: Build and utility scripts (`generate-images.js`, `automate-publish.js`).
- `_site/`: Output directory (do not edit manually).

## 📝 Content Creation & Markdown

### Frontmatter Conventions
All blog posts must include specific frontmatter fields.
**File**: `blog/your-slug.md`

```yaml
---
layout: post.njk
lang: bn-BD
title: "Your Title Here"
description: "SEO optimized description (150-160 chars)."
date: 2025-01-01
lastUpdated: 2025-01-05
ogImage: your-image-optimized.webp # Located in assets/og/
ogImageAlt: "Descriptive alt text"
tags: [post, category1, category2]
faq:
  - question: "Question 1?"
    answer: "Answer 1."
---
```

### Image Handling
**Do not** use standard Markdown image syntax `![alt](src)`. Use the `<picture>` tag pattern for responsive, optimized images.

```html
<picture class="content-image">
  <source srcset="/assets/blog/image-name-optimized.avif" type="image/avif">
  <source srcset="/assets/blog/image-name-optimized.webp" type="image/webp">
  <img src="/assets/blog/image-name-optimized.webp" alt="Description" width="800" height="450" loading="lazy" decoding="async">
</picture>
```
- Images should be placed in `assets/blog/` or `assets/og/`.
- Run `npm run images:convert` or `npm run generate-images` to generate optimized versions.

### Internal Linking
- Use relative paths or root-relative paths: `[Link Text](/blog/target-slug/)`.
- Ensure links end with a trailing slash `/`.

## 💻 Development Workflow

- **Start Dev Server**: `npm start` (Runs Eleventy in watch mode).
- **Build Production**: `npm run build` (Runs Eleventy + CSS build).
- **Optimize Images**: `npm run images:convert` (Converts new images in assets).
- **Publish Post**: `npm run publish:new-post` (Helper script).

## 🎨 Styling & Performance

- **CSS**: Edit `assets/style.css`. It uses custom utility classes and variables (e.g., `--accent`, `--bg`).
- **Critical CSS**: Inlined in `_includes/base.njk` for LCP optimization.
- **Performance**:
  - Avoid layout shifts (CLS). Always define `width` and `height` on images.
  - Use `fetchpriority="high"` for LCP images (like hero images).
  - `universal-performance.js` handles deferred loading.

## 🧩 Components & Templates

- **Layouts**: `base.njk` is the master layout. `post.njk` extends it for blog posts.
- **Shortcodes**: `{% image ... %}` is available but manual `<picture>` tags are preferred in Markdown for control.
- **Filters**:
  - `date`: Formats dates (e.g., `{{ page.date | date("MMMM dd, yyyy") }}`).
  - `readingTime`: Calculates read time.
  - `getRelatedPosts`: Logic in `.eleventy.js`.

## ⚠️ Common Pitfalls
- **Timezone**: The site uses `Asia/Dhaka`. `now` global data is adjusted +6 hours.
- **Nunjucks in Markdown**: Enabled. You can use `{{ site.url }}` inside `.md` files.
- **HTML Minification**: Automatic on build via transform.
