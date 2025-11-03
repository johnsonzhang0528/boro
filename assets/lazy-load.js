// Optimized lazy loading for images
(function() {
  'use strict';
  
  // Check for Intersection Observer support
  if (!('IntersectionObserver' in window)) {
    // Fallback: Load all images immediately for unsupported browsers
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.src = img.dataset.src || img.src;
      img.classList.add('loaded');
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        // Load the image
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
        
        // Add loaded class for smooth transition
        img.onload = () => {
          img.classList.add('loaded');
        };
        
        // Stop observing this image
        imageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px', // Start loading 50px before image enters viewport
    threshold: 0.01
  });

  // Observe all lazy images
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    imageObserver.observe(img);
  });

  // Preload critical images on page load
  window.addEventListener('load', () => {
    const criticalImages = document.querySelectorAll('img[fetchpriority="high"]');
    criticalImages.forEach(img => {
      if (!img.complete) {
        img.loading = 'eager';
      }
    });
  });
})();