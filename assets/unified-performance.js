/**
 * Unified Performance Optimization Script
 * Comprehensive image and page performance optimizations
 * Replaces image-performance.js, withdrawal-performance.js, and lazy-load.js
 */

(function() {
  'use strict';

  // Configuration based on page type
  const config = {
    isWithdrawalPage: window.location.pathname.includes('withdraw'),
    isBlogPage: window.location.pathname.includes('/blog/'),
    prefetchDelay: 2000,
    analyticsDelay: 3000,
    hasWebPSupport: null
  };

  // WebP support detection
  function detectWebPSupport() {
    if (config.hasWebPSupport !== null) return config.hasWebPSupport;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    config.hasWebPSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    return config.hasWebPSupport;
  }

  // Unified image optimization system
  class ImageOptimizer {
    constructor() {
      this.processedImages = new Set();
      this.imageObserver = null;
      this.hasWebPSupport = detectWebPSupport();
      this.init();
    }

    init() {
      this.optimizeCriticalImages();
      this.setupLazyImageOptimization();
      this.optimizeSpecializedImages();
      this.handleInitialPageLoad();
    }

    // Handle initial page load and refresh scenarios
    handleInitialPageLoad() {
      // Wait for page to be fully loaded
      if (document.readyState === 'complete') {
        this.checkVisibleImages();
      } else {
        window.addEventListener('load', () => {
          this.checkVisibleImages();
        });
      }

      // Also check after a short delay to handle dynamic content
      setTimeout(() => {
        this.checkVisibleImages();
      }, 500);
    }

    // Check and load images that are currently visible
    checkVisibleImages() {
      const lazyImages = document.querySelectorAll('img[loading="lazy"]:not(.lazy-loaded):not(.decoded)');
      
      lazyImages.forEach(img => {
        // Check if image is in viewport or close to it
        const rect = img.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        // Load image if it's visible or within 100px of viewport
        const isVisible = (
          rect.top >= -100 && 
          rect.left >= -100 && 
          rect.bottom <= windowHeight + 100 && 
          rect.right <= windowWidth + 100
        );
        
        if (isVisible) {
          this.loadImage(img);
          this.decodeImage(img).then(() => {
            img.classList.add('decoded', 'lazy-loaded');
          });
        }
      });
    }

    // Load image with optimal format selection
    loadImage(img) {
      // Handle data-src for lazy loading
      if (img.dataset.src) {
        img.src = img.dataset.src;
      } else if (this.hasWebPSupport && img.dataset.webp) {
        img.src = img.dataset.webp;
      }
      
      // Setup load handlers
      img.onload = () => {
        img.classList.add('loaded');
        // Remove loading placeholder if exists
        const placeholder = img.parentElement?.querySelector('.img-placeholder');
        if (placeholder) {
          placeholder.remove();
        }
      };
      
      img.onerror = () => {
        // Fallback to original format if WebP fails
        if (this.hasWebPSupport && img.dataset.fallback) {
          img.src = img.dataset.fallback;
        }
      };
    }

    // Optimize critical images (fetchpriority="high", loading="eager")
    optimizeCriticalImages() {
      const criticalImages = document.querySelectorAll('img[fetchpriority="high"], img[loading="eager"]');
      
      criticalImages.forEach(img => {
        if (this.processedImages.has(img)) return;
        
        // Ensure critical images load immediately
        if (!img.complete) {
          img.loading = 'eager';
          this.loadImage(img);
        }
        
        this.decodeImage(img).then(() => {
          img.classList.add('critical-loaded');
        });
        
        this.processedImages.add(img);
      });
    }

    // Setup Intersection Observer for lazy images
    setupLazyImageOptimization() {
      if (!('IntersectionObserver' in window)) {
        // Fallback: Load all images immediately for unsupported browsers
        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
          this.loadImage(img);
        });
        return;
      }

      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      if (lazyImages.length === 0) return;
      
      this.imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            // Skip if already processed
            if (img.classList.contains('lazy-loaded') || img.classList.contains('decoded')) {
              this.imageObserver.unobserve(img);
              return;
            }
            
            // Load the image
            this.loadImage(img);
            
            // Decode for performance
            this.decodeImage(img).then(() => {
              img.classList.add('decoded', 'lazy-loaded');
            });
            
            this.imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '100px 0px', // Increased from 50px to ensure better coverage
        threshold: 0.01
      });

      lazyImages.forEach(img => {
        if (!this.processedImages.has(img)) {
          this.imageObserver.observe(img);
          this.processedImages.add(img);
        }
      });

      // Add scroll event listener as backup
      this.setupScrollBackup();
    }

    // Backup mechanism for scroll events
    setupScrollBackup() {
      let scrollTimeout;
      const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.checkVisibleImages();
        }, 100);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });
    }

    // Handle specialized images (withdrawal, blog-specific)
    optimizeSpecializedImages() {
      if (config.isWithdrawalPage) {
        this.optimizeWithdrawalImages();
      }
      
      // Add other page-specific optimizations here
    }

    // Withdrawal page specific optimizations
    optimizeWithdrawalImages() {
      const withdrawalImages = document.querySelectorAll('.withdrawal-image');
      
      withdrawalImages.forEach((img, index) => {
        if (this.processedImages.has(img)) return;
        
        if (index === 0) {
          // First image gets priority treatment
          this.decodeImage(img).then(() => {
            img.classList.add('priority-loaded', 'critical-image');
          });
        }
        
        this.processedImages.add(img);
      });
    }

    // Unified image decode function
    async decodeImage(img) {
      if (!img.decode || img.classList.contains('decoded')) {
        return Promise.resolve();
      }
      
      try {
        await img.decode();
        img.classList.add('decoded');
      } catch (error) {
        // Silent fail - browser will handle normally
        img.classList.add('decoded');
      }
    }

    // Cleanup
    destroy() {
      if (this.imageObserver) {
        this.imageObserver.disconnect();
      }
    }
  }

  // Resource preloading system
  class ResourcePreloader {
    constructor() {
      this.preloadedResources = new Set();
    }

    // Preload related resources based on page type
    preloadPageResources() {
      const delay = config.isWithdrawalPage ? 3000 : config.prefetchDelay;
      
      setTimeout(() => {
        const resources = this.getResourcesForPage();
        resources.forEach(url => this.prefetchResource(url));
      }, delay);
    }

    // Get resources to preload based on current page
    getResourcesForPage() {
      const baseResources = ['/go/borojeet'];
      
      if (config.isWithdrawalPage) {
        return [
          ...baseResources,
          '/blog/understanding-wagering-requirements/',
          '/blog/beginners-guide-to-borojeet/'
        ];
      }
      
      if (config.isBlogPage) {
        return [
          ...baseResources,
          '/blog/',
        ];
      }
      
      return baseResources;
    }

    // Prefetch a resource
    prefetchResource(url) {
      if (this.preloadedResources.has(url)) return;
      
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
      
      this.preloadedResources.add(url);
    }

    // Preload on hover for better UX
    setupHoverPreloading() {
      const links = document.querySelectorAll('a[href^="/"], .cta, a[href*="borojeet"]');
      
      links.forEach(link => {
        link.addEventListener('mouseenter', () => {
          if (link.href && !link.dataset.preloaded) {
            this.prefetchResource(link.href);
            link.dataset.preloaded = 'true';
          }
        }, { once: true });
      });
    }
  }

  // Form and interaction optimizations
  class InteractionOptimizer {
    constructor() {
      this.setupFormOptimizations();
    }

    setupFormOptimizations() {
      // Optimize form inputs with debounced validation
      const inputs = document.querySelectorAll('input[type="number"], input[type="tel"], input[type="email"]');
      
      inputs.forEach(input => {
        input.addEventListener('input', this.debounce((event) => {
          const input = event.target;
          if (input.value && input.checkValidity()) {
            input.classList.add('valid');
            input.classList.remove('invalid');
          } else if (input.value) {
            input.classList.add('invalid');
            input.classList.remove('valid');
          }
        }, 300));
      });
    }

    // Utility: debounce function
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  }

  // Main performance controller
  class PerformanceController {
    constructor() {
      this.imageOptimizer = null;
      this.resourcePreloader = null;
      this.interactionOptimizer = null;
    }

    init() {
      // Initialize all optimization systems
      this.imageOptimizer = new ImageOptimizer();
      this.resourcePreloader = new ResourcePreloader();
      this.interactionOptimizer = new InteractionOptimizer();
      
      // Setup resource preloading
      this.resourcePreloader.preloadPageResources();
      this.resourcePreloader.setupHoverPreloading();
      
      // Setup emergency image loading as final fallback
      this.setupEmergencyImageLoading();
      
      // Log performance info in development
      if (window.location.hostname === 'localhost') {
        console.log('Performance optimizations initialized for:', {
          pageType: config.isWithdrawalPage ? 'withdrawal' : config.isBlogPage ? 'blog' : 'general',
          optimizations: ['images', 'preloading', 'interactions']
        });
      }
    }

    // Emergency fallback: ensure all images load after a delay
    setupEmergencyImageLoading() {
      setTimeout(() => {
        const unloadedImages = document.querySelectorAll('img[loading="lazy"]:not(.lazy-loaded):not(.decoded)');
        
        if (unloadedImages.length > 0) {
          console.log(`Emergency loading ${unloadedImages.length} images that weren't loaded by lazy loading`);
          
          unloadedImages.forEach(img => {
            this.imageOptimizer.loadImage(img);
            this.imageOptimizer.decodeImage(img).then(() => {
              img.classList.add('decoded', 'emergency-loaded');
            });
          });
        }
      }, 3000); // Wait 3 seconds before emergency loading
    }

    // Cleanup method for SPA navigation
    destroy() {
      if (this.imageOptimizer) {
        this.imageOptimizer.destroy();
      }
    }
  }

  // Initialize when DOM is ready
  function initializePerformanceOptimizations() {
    const controller = new PerformanceController();
    controller.init();
    
    // Expose for potential cleanup in SPAs
    window.performanceController = controller;
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePerformanceOptimizations);
  } else {
    initializePerformanceOptimizations();
  }

})();