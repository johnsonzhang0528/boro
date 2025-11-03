// Optimized lazy loading for images with WebP support
(function() {
  'use strict';
  
  // Check for WebP support
  function supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  const hasWebPSupport = supportsWebP();
  
  // Check for Intersection Observer support
  if (!('IntersectionObserver' in window)) {
    // Fallback: Load all images immediately for unsupported browsers
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      loadImage(img);
    });
    return;
  }

  function loadImage(img) {
    // Load the optimal format
    if (img.dataset.src) {
      img.src = img.dataset.src;
    } else if (hasWebPSupport && img.dataset.webp) {
      img.src = img.dataset.webp;
    }
    
    // Add loaded class for smooth transition
    img.onload = () => {
      img.classList.add('loaded');
      // Remove loading placeholder if exists
      const placeholder = img.parentElement.querySelector('.img-placeholder');
      if (placeholder) {
        placeholder.remove();
      }
    };
    
    img.onerror = () => {
      // Fallback to original format if WebP fails
      if (hasWebPSupport && img.dataset.fallback) {
        img.src = img.dataset.fallback;
      }
    };
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        loadImage(img);
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
        loadImage(img);
      }
    });
  });

  // Prefetch next page images on hover
  document.addEventListener('mouseover', (e) => {
    if (e.target.matches('a[href*="/blog/"]')) {
      const link = e.target;
      if (!link.dataset.prefetched) {
        link.dataset.prefetched = 'true';
        // Prefetch logic can be added here
      }
    }
  });
})();