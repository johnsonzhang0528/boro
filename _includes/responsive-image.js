// Responsive image shortcode for 11ty with enhanced CLS prevention
// Usage: {% responsiveImage "path/to/image.jpg", "Alt text", "sizes", "loading", "aspect-ratio" %}

const path = require('path');

module.exports = function(src, alt, sizes = "100vw", loading = "lazy", aspectRatio = "16/9") {
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
  const decoding = loading === 'lazy' ? 'decoding="async"' : 'decoding="sync"';
  
  // Calculate dimensions for CLS prevention
  const [width, height] = aspectRatio.split('/').map(Number);
  const baseWidth = sizes_config.desktop;
  const calculatedHeight = Math.round((baseWidth * height) / width);
  
  return `
    <figure class="img-frame" style="aspect-ratio: ${aspectRatio};">
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
          width="${baseWidth}"
          height="${calculatedHeight}"
          ${fetchPriority}
          ${decoding}
          sizes="${sizes}"
          style="width: 100%; height: 100%; object-fit: cover; display: block;">
      </picture>
    </figure>
  `.trim();
};