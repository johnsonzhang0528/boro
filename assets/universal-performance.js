/**
 * Universal Performance Optimizer
 * Generic system based on HTML data attributes and CSS classes
 * No hardcoded page paths - works for any page with proper markup
 */

(function() {
  'use strict';

  // Universal configuration
  const config = {
    prefetchDelay: 2000,
    analyticsDelay: 3000,
    emergencyLoadDelay: 3000,
    observerOptions: {
      rootMargin: '100px 0px',
      threshold: 0.01
    }
  };

  // WebP support detection
  let webpSupported = null;
  function detectWebPSupport() {
    if (webpSupported !== null) return webpSupported;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    return webpSupported;
  }

  /**
   * Universal Image Optimizer
   * Works with any images that have data-* attributes or specific classes
   */
  class UniversalImageOptimizer {
    constructor() {
      this.processedImages = new Set();
      this.imageObserver = null;
      this.hasWebPSupport = detectWebPSupport();
      this.init();
    }

    init() {
      this.optimizeCriticalImages();
      this.setupLazyImageOptimization();
      this.setupScrollBackup();
    }

    optimizeCriticalImages() {
      // Find images marked as critical via data attributes
      const criticalImages = document.querySelectorAll('[data-critical="true"], [fetchpriority="high"], img[loading="eager"]');
      
      criticalImages.forEach((img, index) => {
        if (this.processedImages.has(img)) return;
        
        // Decode critical images immediately
        this.decodeImage(img).then(() => {
          img.classList.add('critical-loaded', 'decoded');
          
          // Mark first critical image as LCP candidate
          if (index === 0) {
            img.classList.add('lcp-candidate');
            this.trackLCPImage(img);
          }
        });
        
        this.processedImages.add(img);
      });
    }

    trackLCPImage(img) {
      img.addEventListener('load', () => {
        // Track LCP image loading for analytics
        if (window.gtag) {
          const pageType = document.body.dataset.pageType || 'unknown';
          gtag('event', 'lcp_image_loaded', {
            event_category: 'performance',
            event_label: `${pageType}_lcp_image`
          });
        }
      }, { once: true });
    }

    setupLazyImageOptimization() {
      if (!('IntersectionObserver' in window)) {
        this.fallbackImageLoading();
        return;
      }

      const lazyImages = document.querySelectorAll('img[loading="lazy"], [data-lazy="true"]');
      
      if (lazyImages.length === 0) return;

      this.imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img);
            this.decodeImage(img).then(() => {
              img.classList.add('decoded', 'lazy-loaded');
            });
            this.imageObserver.unobserve(img);
          }
        });
      }, config.observerOptions);

      lazyImages.forEach(img => {
        if (!this.processedImages.has(img)) {
          this.imageObserver.observe(img);
          this.processedImages.add(img);
        }
      });
    }

    loadImage(img) {
      // Handle data-src attributes (common lazy loading pattern)
      if (img.dataset.src && !img.src) {
        img.src = img.dataset.src;
      }
      
      // Handle srcset
      if (img.dataset.srcset && !img.srcset) {
        img.srcset = img.dataset.srcset;
      }

      // Remove lazy loading attribute once loaded
      img.removeAttribute('loading');
    }

    async decodeImage(img) {
      if (!img.decode || img.classList.contains('decoded')) {
        return Promise.resolve();
      }

      try {
        await img.decode();
        img.classList.add('decoded');
      } catch (error) {
        // Fallback: mark as decoded anyway
        img.classList.add('decoded');
      }
    }

    setupScrollBackup() {
      let scrollTimer;
      const checkImages = () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          this.checkVisibleImages();
        }, 100);
      };

      window.addEventListener('scroll', checkImages, { passive: true });
      window.addEventListener('resize', checkImages, { passive: true });
    }

    checkVisibleImages() {
      const lazyImages = document.querySelectorAll('img[loading="lazy"]:not(.lazy-loaded)');
      lazyImages.forEach(img => {
        if (this.isImageInViewport(img)) {
          this.loadImage(img);
          this.decodeImage(img);
        }
      });
    }

    isImageInViewport(img) {
      const rect = img.getBoundingClientRect();
      return rect.top < window.innerHeight + 100 && rect.bottom > -100;
    }

    fallbackImageLoading() {
      // Fallback for browsers without IntersectionObserver
      const lazyImages = document.querySelectorAll('img[loading="lazy"], [data-lazy="true"]');
      lazyImages.forEach(img => this.loadImage(img));
    }

    destroy() {
      if (this.imageObserver) {
        this.imageObserver.disconnect();
      }
    }
  }

  /**
   * Universal Resource Preloader
   * Uses data attributes to determine what to preload
   */
  class UniversalResourcePreloader {
    constructor() {
      this.preloadedResources = new Set();
    }

    init() {
      this.preloadPageResources();
      this.setupHoverPreloading();
    }

    preloadPageResources() {
      // Get preload configuration from page data attributes
      const body = document.body;
      const preloadUrls = this.getPreloadUrls(body);
      
      const delay = parseInt(body.dataset.preloadDelay) || config.prefetchDelay;
      
      setTimeout(() => {
        preloadUrls.forEach(url => this.prefetchResource(url));
      }, delay);
    }

    getPreloadUrls(body) {
      const urls = [];
      
      // Get URLs from data attributes
      if (body.dataset.preloadUrls) {
        const preloadData = JSON.parse(body.dataset.preloadUrls);
        urls.push(...preloadData);
      }
      
      // Get related links from the page
      const relatedLinks = document.querySelectorAll('[data-preload="true"]');
      relatedLinks.forEach(link => {
        if (link.href) urls.push(link.href);
      });
      
      // Always include common resources
      urls.push('/go/borojeet');
      
      return [...new Set(urls)]; // Remove duplicates
    }

    prefetchResource(url) {
      if (this.preloadedResources.has(url)) return;

      const link = document.createElement('link');
      let isExternal = false;
      try {
        // For full URLs, this will create a URL object.
        // For relative URLs, it will resolve against the base URL.
        isExternal = new URL(url, window.location.origin).hostname !== window.location.hostname;
      } catch (e) {
        // If the URL is malformed or something else goes wrong, assume it's not external.
        isExternal = false;
      }

      if (isExternal) {
        link.rel = 'nofollow';
      } else {
        link.rel = 'prefetch';
      }
      link.href = url;

      document.head.appendChild(link);
      this.preloadedResources.add(url);
    }

    setupHoverPreloading() {
      const preloadableLinks = document.querySelectorAll('a[href^="/"], .cta, a[href*="borojeet"], [data-hover-preload="true"]');
      
      preloadableLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
          if (link.href && !link.dataset.preloaded) {
            this.prefetchResource(link.href);
            link.dataset.preloaded = 'true';
          }
        }, { once: true });
      });
    }
  }

  /**
   * Universal Interaction Optimizer
   * Generic event handling optimizations
   */
  class UniversalInteractionOptimizer {
    constructor() {
      this.init();
    }

    init() {
      this.optimizeScrolling();
      this.optimizeClicks();
      this.setupFormOptimizations();
    }

    optimizeScrolling() {
      let scrollTimer;
      const optimizedScrollHandler = this.throttle(() => {
        // Trigger any scroll-based optimizations
        this.triggerScrollOptimizations();
      }, 100);

      window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    }

    triggerScrollOptimizations() {
      // Check for elements that need scroll-based optimization
      const scrollOptimized = document.querySelectorAll('[data-scroll-optimize="true"]');
      scrollOptimized.forEach(element => {
        if (this.isElementInViewport(element)) {
          element.classList.add('in-viewport');
          // Trigger any specific optimizations
          this.handleScrollOptimization(element);
        }
      });
    }

    handleScrollOptimization(element) {
      // Handle specific scroll optimizations based on element type
      if (element.dataset.scrollAction) {
        switch (element.dataset.scrollAction) {
          case 'preload-next':
            this.preloadNextContent(element);
            break;
          case 'track-view':
            this.trackElementView(element);
            break;
        }
      }
    }

    optimizeClicks() {
      document.addEventListener('click', (e) => {
        // Optimize clicks on important elements
        if (e.target.classList.contains('cta') || e.target.dataset.track === 'true') {
          this.handleImportantClick(e.target);
        }
      });
    }

    handleImportantClick(element) {
      // Track important clicks for analytics
      if (window.gtag && element.dataset.trackEvent) {
        gtag('event', element.dataset.trackEvent, {
          event_category: 'interaction',
          event_label: element.dataset.trackLabel || element.textContent
        });
      }
    }

    setupFormOptimizations() {
      const forms = document.querySelectorAll('form[data-optimize="true"]');
      forms.forEach(form => {
        // Add form-specific optimizations
        this.optimizeForm(form);
      });
    }

    optimizeForm(form) {
      // Implement form optimization logic
      form.addEventListener('submit', (e) => {
        // Add any form submission optimizations
        this.handleFormSubmit(form, e);
      });
    }

    isElementInViewport(element) {
      const rect = element.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }

    throttle(func, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  }

  /**
   * Main Performance Manager
   * Coordinates all optimization modules
   */
  class UniversalPerformanceManager {
    constructor() {
      this.imageOptimizer = null;
      this.resourcePreloader = null;
      this.interactionOptimizer = null;
    }

    init() {
      // Initialize all optimization modules
      this.imageOptimizer = new UniversalImageOptimizer();
      this.resourcePreloader = new UniversalResourcePreloader();
      this.interactionOptimizer = new UniversalInteractionOptimizer();
      
      this.resourcePreloader.init();
      this.setupEmergencyImageLoading();
      this.logInitialization();
    }

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
      }, config.emergencyLoadDelay);
    }

    logInitialization() {
      if (window.location.hostname === 'localhost') {
        const pageType = document.body.dataset.pageType || 'unknown';
        console.log('Universal Performance Optimizer initialized:', {
          pageType,
          criticalImages: document.querySelectorAll('[data-critical="true"], [fetchpriority="high"]').length,
          lazyImages: document.querySelectorAll('img[loading="lazy"]').length,
          preloadUrls: document.body.dataset.preloadUrls ? JSON.parse(document.body.dataset.preloadUrls).length : 0
        });
      }
    }

    destroy() {
      if (this.imageOptimizer) this.imageOptimizer.destroy();
    }
  }

  // Initialize the universal performance manager
  const performanceManager = new UniversalPerformanceManager();
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => performanceManager.init());
  } else {
    performanceManager.init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => performanceManager.destroy());

  // Expose for debugging
  window.UniversalPerformanceManager = performanceManager;

})();