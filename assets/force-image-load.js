/**
 * Simple and Reliable Image Loading Solution
 * Ensures all images load regardless of page state or scroll position
 */

(function() {
  'use strict';

  // Force load all images immediately
  function forceLoadAllImages() {
    const allImages = document.querySelectorAll('img');
    
    allImages.forEach(img => {
      // If image has data-src, use it (for lazy loading)
      if (img.dataset.src && !img.src) {
        img.src = img.dataset.src;
      }
      
      // If image has srcset in picture element, ensure it loads
      const picture = img.closest('picture');
      if (picture) {
        const sources = picture.querySelectorAll('source');
        sources.forEach(source => {
          if (source.srcset && !img.src) {
            // Extract first srcset URL
            const firstSrc = source.srcset.split(' ')[0];
            if (firstSrc) {
              img.src = firstSrc;
            }
          }
        });
      }
      
      // Force loading state
      img.loading = 'eager';
      img.classList.add('force-loaded');
      
      // Add error handling
      img.onerror = function() {
        console.log('Image failed to load:', this.src);
        // Try fallback if available
        if (this.dataset.fallback) {
          this.src = this.dataset.fallback;
        }
      };
      
      img.onload = function() {
        this.classList.add('loaded');
      };
    });
  }

  // Run immediately
  forceLoadAllImages();

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceLoadAllImages);
  }

  // Run after page is fully loaded
  window.addEventListener('load', forceLoadAllImages);

  // Run with a delay to catch any dynamically added images
  setTimeout(forceLoadAllImages, 1000);
  setTimeout(forceLoadAllImages, 3000);

})();