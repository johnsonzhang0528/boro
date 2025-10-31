const { DateTime } = require("luxon");
const Image = require("@11ty/eleventy-img");

async function imageShortcode(src, alt, sizes, loading = "lazy", fetchpriority = "auto") {
  let metadata = await Image(src, {
    widths: [300, 600, 1200],
    formats: ["webp", "jpeg"],
    outputDir: "./_site/img/",
    urlPath: "/img/",
  });

  let imageAttributes = {
    alt,
    sizes,
    loading,
    fetchpriority,
    decoding: "async",
  };

  return Image.generateHTML(metadata, imageAttributes);
}

module.exports = function(eleventyConfig) {
  // Add this line to watch your CSS file for changes
  eleventyConfig.addWatchTarget("./assets/style.css");

  // Passthrough Copy: Copy `assets` folder to `_site/assets`
  eleventyConfig.addPassthroughCopy("assets");

  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);

  eleventyConfig.addFilter("date", (dateObj, format) => {
    return DateTime.fromJSDate(dateObj).toFormat(format);
  });

  eleventyConfig.addCollection("post", (api) => {
    return api.getFilteredByTag("post")
      .filter(item => !item.data.draft)
      .filter(item => (item.date || item.data.date) <= new Date())
      .sort((a,b) => (b.date || b.data.date) - (a.date || a.data.date));
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
