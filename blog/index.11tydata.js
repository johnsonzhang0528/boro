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
  eleventyComputed: {
    post_id: (data) => {
      // Ensure we are only calculating for actual posts
      if (data.tags && data.tags.includes('post')) {
        const posts = data.collections.post;
        const totalPosts = posts.length;
        // Find the index of the current post in the date-descending collection
        const currentIndex = posts.findIndex(p => p.inputPath === data.page.inputPath);
        // Reverse the index to get a chronological ID (oldest = 1)
        return totalPosts - currentIndex;
      }
      return null;
    }
  }
};
