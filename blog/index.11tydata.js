module.exports = {
  layout: "base.njk",
  pagination: {
    data: "collections.post",
    size: 10,
    alias: "posts",
    addAllPagesToCollections: true,
  },
  // eleventyExcludeFromCollections: true, // Removed to allow sitemap inclusion
  permalink: (data) => {
    if (data.pagination && data.pagination.pageNumber > 0) {
      return `/blog/page-${data.pagination.pageNumber + 1}/`;
    }
    return "/blog/";
  },
  eleventyComputed: {
    title: (data) => {
      if (data.pagination && data.pagination.pageNumber > 0) {
        return `BoroJeet ব্লগ — পেজ ${data.pagination.pageNumber + 1} | গাইড ও টিপস`;
      }
      return "BoroJeet ব্লগ — ক্যাসিনো, ক্রিকেট বেটিং ও পেমেন্ট গাইড";
    },
    description: (data) => {
      if (data.pagination && data.pagination.pageNumber > 0) {
        return `BoroJeet ব্লগের পেজ ${data.pagination.pageNumber + 1} — ক্যাসিনো, ক্রিকেট বেটিং ও পেমেন্ট নিয়ে এক্সপার্ট গাইড ব্রাউজ করুন।`;
      }
      return "BoroJeet অফিসিয়াল ব্লগ: Crash/Slots গেম গাইড, ক্রিকেট বেটিং টিপস, bKash/Nagad পেমেন্ট সমাধান ও বোনাস আপডেট — সব বাংলায়।";
    },
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
