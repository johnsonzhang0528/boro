// Responsive image shortcode for 11ty
// Usage: {% responsiveImage "path/to/image.jpg", "Alt text", "sizes", "loading" %}

const path = require('path');

module.exports = function(src, alt, sizes = "100vw", loading = "lazy") {
  const ext = path.extname(src);
  const name = path.basename(src, ext);
  const dir = path.dirname(src);
  
  // Generate different sizes
  const sizes_config = {
    mobile: 480,
    tablet: 768,
    desktop: 1200
  };
  
  let srcset_webp = '';
  let srcset_original = '';
  
  Object.entries(sizes_config).forEach(([key, width]) => {
    srcset_webp += `${dir}/${name}-${key}.webp ${width}w, `;
    srcset_original += `${dir}/${name}-${key}${ext} ${width}w, `;
  });
  
  // Remove trailing comma and space
  srcset_webp = srcset_webp.slice(0, -2);
  srcset_original = srcset_original.slice(0, -2);
  
  const fetchPriority = loading === 'eager' ? 'fetchpriority="high"' : '';
  const decoding = loading === 'lazy' ? 'decoding="async"' : '';
  
  return `
    <picture>
      <source 
        srcset="${srcset_webp}" 
        type="image/webp" 
        sizes="${sizes}">
      <img 
        src="${dir}/${name}-desktop${ext}" 
        srcset="${srcset_original}"
        alt="${alt}" 
        loading="${loading}"
        ${fetchPriority}
        ${decoding}
        sizes="${sizes}"
        style="width: 100%; height: auto; aspect-ratio: 16/9; object-fit: cover;">
    </picture>
  `.trim();
};