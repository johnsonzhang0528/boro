// Performance optimization utilities
// Additional improvements for CLS and overall performance

// 1. Critical Resource Hints Generator
function generateResourceHints() {
  const hints = [
    '<link rel="dns-prefetch" href="//www.googletagmanager.com">',
    '<link rel="dns-prefetch" href="//www.google-analytics.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="preload" href="/assets/borojeet-affiliate-logo-bd.webp" as="image" fetchpriority="high">',
    '<link rel="preload" href="/assets/style.css" as="style">',
    '<link rel="modulepreload" href="/assets/lazy-load.js">'
  ];
  
  return hints.join('\n  ');
}

// 2. Image dimension calculator for CLS prevention
function calculateImageDimensions(width, height, maxWidth = 1200) {
  const aspectRatio = width / height;
  const calculatedHeight = Math.round(maxWidth / aspectRatio);
  
  return {
    width: maxWidth,
    height: calculatedHeight,
    aspectRatio: `${width}/${height}`
  };
}

// 3. Critical CSS extractor (simplified)
function extractCriticalCSS() {
  return `
    /* Ultra-critical CSS for immediate rendering */
    :root {
      --bg: #0b0f14;
      --text: #e9f2ff;
      --accent: #10b981;
      --maxw: 1120px;
    }
    
    * { box-sizing: border-box; margin: 0; }
    
    body {
      font-family: ui-sans-serif, system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      overflow-x: hidden;
    }
    
    .wrap {
      max-width: var(--maxw);
      margin: 0 auto;
      padding: 16px;
    }
    
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(11,15,20,.8);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid #1f2937;
    }
    
    header .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 60px;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
    }
    
    .logo img {
      width: 71px !important;
      height: 20px !important;
      flex-shrink: 0;
    }
    
    /* All images get immediate dimensions */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      content-visibility: auto;
    }
    
    figure.img-frame {
      margin: 0;
      aspect-ratio: 16/9;
      overflow: hidden;
      border-radius: 16px;
      contain: layout style paint;
    }
    
    .img-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `;
}

// 4. Performance monitoring setup
function setupPerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    // Monitor CLS
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          console.log('CLS detected:', entry.value);
          if (entry.value > 0.1) {
            console.warn('High CLS detected:', entry.value, entry.sources);
          }
        }
      }
    }).observe({entryTypes: ['layout-shift']});
    
    // Monitor LCP
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({entryTypes: ['largest-contentful-paint']});
  }
}

// 5. Image loading optimization
function optimizeImageLoading() {
  // Add intersection observer for all images
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Add loading class for smooth transition
          img.classList.add('loading');
          
          img.onload = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
          };
          
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
    
    // Observe all lazy images
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Export for use in build process
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateResourceHints,
    calculateImageDimensions,
    extractCriticalCSS,
    setupPerformanceMonitoring,
    optimizeImageLoading
  };
}