const { DateTime } = require("luxon");
const path = require("path");
const esbuild = require("esbuild");
const Image = require("@11ty/eleventy-img");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginTOC = require("eleventy-plugin-toc");
const htmlMinifier = require("html-minifier");

function requireWithFallback(primary, fallback) {
  try {
    return require(primary);
  } catch (error) {
    return require(fallback);
  }
}

const markdownIt = requireWithFallback("markdown-it", "markdown-it/dist/markdown-it");
const markdownItAnchor = requireWithFallback("markdown-it-anchor", "markdown-it-anchor/dist/markdownItAnchor.js");

async function imageShortcode(src, alt, sizes, loading = "lazy", fetchpriority = "auto") {
  let fullSrc = path.join(__dirname, src);
  let metadata = await Image(fullSrc, {
    widths: [300, 600, 700, 900, 1200, 1400],
    formats: ["webp", "jpeg"],
    outputDir: "./_site/img/",
    urlPath: "/img/",
    sharpWebpOptions: {
      quality: 80, // Improved quality for better LCP
      effort: 6,   // Better compression
    },
    sharpJpegOptions: {
      quality: 80, // Improved quality for better LCP
      progressive: true,
      mozjpeg: true, // Better compression
    },
  });

  let imageAttributes = {
    alt,
    sizes,
    loading,
    fetchpriority,
    decoding: "async",
    style: "aspect-ratio: 16/9; object-fit: cover;", // Prevent CLS
  };

  return Image.generateHTML(metadata, imageAttributes);
}

module.exports = function(eleventyConfig) {
  eleventyConfig.on("eleventy.before", async () => {
    await esbuild.build({
      entryPoints: ["assets/style.css"],
      bundle: true,
      minify: true,
      outfile: "_site/assets/style.min.css",
    });
  });

  // Add 'now' global data for date comparisons (using Asia/Dhaka timezone)
  // We add 6 hours to match Eleventy's default UTC date parsing for Front Matter
  eleventyConfig.addGlobalData("now", () => {
    return DateTime.now().plus({ hours: 6 }).toJSDate();
  });

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ['h2', 'h3'],
    wrapper: 'div',
    ul: true
  });

  // Add this line to watch your CSS file for changes
  eleventyConfig.addWatchTarget("./assets/style.css");

  // Passthrough Copy: Copy `assets` folder to `_site/assets`
  eleventyConfig.addPassthroughCopy("assets");

  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("manifest.json");
  
  // Add service worker for performance optimization
  eleventyConfig.addPassthroughCopy("sw.js");

  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);

  // Markdown Configuration
  const markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.headerLink(),
    slugify: (s) => s.trim().toLowerCase().replace(/[\s+~\/]/g, "-").replace(/[().`,%·'"!?]+/g, ""),
  });
  eleventyConfig.setLibrary("md", markdownLibrary);

  eleventyConfig.addFilter("date", (dateObj, format) => {
    return DateTime.fromJSDate(dateObj, { zone: 'Asia/Dhaka' }).toFormat(format);
  });

  eleventyConfig.addFilter("readingTime", (content) => {
    const wordsPerMinute = 200;
    const numberOfWords = content.split(/\s/g).length;
    const minutes = Math.ceil(numberOfWords / wordsPerMinute);
    return `${minutes} min read`;
  });

  // Hide future-dated (noindex) posts from listings that read raw collections,
  // so crawlable pages never link to not-yet-published URLs.
  eleventyConfig.addFilter("publishedOnly", (collection) => {
    if (!collection) return [];
    const cutoff = DateTime.now().plus({ hours: 6 }).toJSDate();
    return collection.filter(item => (item.date || item.data.date) <= cutoff);
  });

  // Advanced Related Posts Logic
  eleventyConfig.addFilter("getRelatedPosts", (collection, currentUrl, currentTags) => {
    if (!collection || !currentTags) return [];
    
    // Filter out current post
    const posts = collection.filter(post => post.url !== currentUrl);
    
    const scoredPosts = posts.map(post => {
      let score = 0;
      const postTags = post.data.tags || [];
      
      // Calculate intersection count (excluding 'post' tag)
      const intersection = postTags.filter(tag => tag !== 'post' && currentTags.includes(tag));
      score = intersection.length;
      
      return { post, score };
    });
    
    // Sort by score (descending), then by date (descending)
    scoredPosts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.post.date - a.post.date;
    });
    
    // Return top 4 posts
    return scoredPosts.slice(0, 4).map(item => item.post);
  });

  eleventyConfig.addCollection("post", (api) => {
    // Use glob to catch ALL .md files in blog/ regardless of tags,
    // so posts missing the "post" tag are still included in the listing.
    return api.getFilteredByGlob("./blog/**/*.md")
      .filter(item => !item.data.draft)
      .filter(item => (item.date || item.data.date) <= DateTime.now().plus({ hours: 6 }).toJSDate())
      .sort((a,b) => (b.date || b.data.date) - (a.date || a.data.date));
  });

  // HTML Minification Transform
  eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if( outputPath && outputPath.endsWith(".html") ) {
      let minified = htmlMinifier.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true
      });
      return minified;
    }
    return content;
  });

  return {
    // Set custom directories for input, output, includes, and data
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site",
    },
    // Files to process as templates, includes HTML and Markdown
    templateFormats: ["html", "md", "njk"],
    // Pre-process Markdown files with Nunjucks
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
