/**
 * Advanced Image Performance Optimization
 * Improves LCP and reduces layout shifts
 */

(function() {
  'use strict';

  // Early image optimization for LCP
  function optimizeImageLoading() {
    // Find all high-priority images
    const criticalImages = document.querySelectorAll('img[fetchpriority="high"], img[loading="eager"]');
    
    criticalImages.forEach(img => {
      // Ensure decode happens asynchronously
      if (img.decode) {
        img.decode().catch(() => {
          // Silent fail - browser will handle normally
        });
      }
      
      // Mark as loaded to prevent further processing
      img.classList.add('critical-loaded');
    });
  }

  // Intersection Observer for lazy images performance boost
  function setupLazyImageOptimization() {
    if (!('IntersectionObserver' in window)) return;

    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Pre-decode for smoother loading
          if (img.decode && !img.classList.contains('decoded')) {
            img.decode().then(() => {
              img.classList.add('decoded', 'loaded');
            }).catch(() => {
              img.classList.add('loaded');
            });
          } else {
            img.classList.add('loaded');
          }
          
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Preload next critical resources
  function preloadNextResources() {
    // Only run on blog pages
    if (!window.location.pathname.includes('/blog/')) return;
    
    // Preload related article images when user scrolls
    let scrolled = false;
    function handleScroll() {
      if (scrolled) return;
      scrolled = true;
      
      // Find next article links and preload their images
      setTimeout(() => {
        const nextLinks = document.querySelectorAll('.article-list a[href*="/blog/"]');
        nextLinks.forEach((link, index) => {
          if (index < 2) { // Only preload first 2 related articles
            const href = link.getAttribute('href');
            if (href) {
              // Create preload link for potential next page hero image
              const preloadLink = document.createElement('link');
              preloadLink.rel = 'prefetch';
              preloadLink.href = href;
              document.head.appendChild(preloadLink);
            }
          }
        });
      }, 1000);
    }
    
    window.addEventListener('scroll', handleScroll, { once: true, passive: true });
  }

  // Initialize when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        optimizeImageLoading();
        setupLazyImageOptimization();
        preloadNextResources();
      });
    } else {
      optimizeImageLoading();
      setupLazyImageOptimization();
      preloadNextResources();
    }
  }

  init();
})();