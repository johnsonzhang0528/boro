const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const imageminPngquant = require('imagemin-pngquant');
const imageminMozjpeg = require('imagemin-mozjpeg');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  console.log('Starting image optimization...');
  
  try {
    // Optimize blog images
    const blogImages = await imagemin(['assets/blog/*.{jpg,png}'], {
      destination: 'assets/blog/optimized',
      plugins: [
        imageminMozjpeg({ quality: 85 }),
        imageminPngquant({ quality: [0.8, 0.9] }),
        imageminWebp({ quality: 85 })
      ]
    });

    // Optimize OG images
    const ogImages = await imagemin(['assets/og/*.{jpg,png}'], {
      destination: 'assets/og/optimized',
      plugins: [
        imageminMozjpeg({ quality: 85 }),
        imageminPngquant({ quality: [0.8, 0.9] }),
        imageminWebp({ quality: 85 })
      ]
    });

    console.log(`Optimized ${blogImages.length} blog images`);
    console.log(`Optimized ${ogImages.length} OG images`);
    
    // Generate responsive image markup helper
    generateResponsiveImageHelper();
    
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

function generateResponsiveImageHelper() {
  const helperContent = `
// Responsive image helper for 11ty
module.exports = function(src, alt, sizes = "100vw", loading = "lazy") {
  const ext = path.extname(src);
  const name = path.basename(src, ext);
  const dir = path.dirname(src);
  
  const webpSrc = \`\${dir}/optimized/\${name}.webp\`;
  const originalSrc = \`\${dir}/optimized/\${name}\${ext}\`;
  
  return \`
    <picture>
      <source srcset="\${webpSrc}" type="image/webp">
      <img 
        src="\${originalSrc}" 
        alt="\${alt}" 
        loading="\${loading}"
        \${loading === 'lazy' ? 'decoding="async"' : 'fetchpriority="high"'}
        style="width: 100%; height: auto;">
    </picture>
  \`;
};
  `;
  
  fs.writeFileSync('_includes/responsive-image.js', helperContent);
  console.log('Generated responsive image helper');
}

// Run optimization
optimizeImages();