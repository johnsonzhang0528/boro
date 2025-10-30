module.exports = {
  layout: "base.njk",
  title: "BoroJeet Blog - Guides, Tips & News for Bangladesh",
  description: "The official blog for BoroJeet Bangladesh. Get the latest tips, game guides for Crash/Slots, and news on bonuses.",
  pagination: {
    data: "collections.post",
    size: 10,
    alias: "posts",
  },
  eleventyExcludeFromCollections: true,
  permalink: (data) => {
    if (data.pagination && data.pagination.pageNumber > 0) {
      return `/blog/page-${data.pagination.pageNumber + 1}/`;
    }
    return "/blog/";
  },
};
