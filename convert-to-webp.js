const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Simple image optimization - convert existing images to WebP
async function convertToWebP(inputPath) {
  try {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(dir, `${name}.webp`);
    
    // Check if WebP version already exists
    try {
      await fs.access(outputPath);
      console.log(`✅ WebP already exists: ${outputPath}`);
      return;
    } catch {
      // File doesn't exist, create it
    }
    
    await sharp(inputPath)
      .webp({ 
        quality: 85,
        effort: 6 
      })
      .toFile(outputPath);
      
    console.log(`✅ Created WebP: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error converting ${inputPath}:`, error.message);
  }
}

async function optimizeExistingImages() {
  console.log('🚀 Converting existing images to WebP...');
  
  const imagesToConvert = [
    './assets/blog/nagad-bKash-payment-flow.png',
    './assets/og/nagad-vs-bkash.jpg',
    './assets/borojeet-affiliate-logo-bd.webp' // Already WebP, skip
  ];
  
  for (const imagePath of imagesToConvert) {
    try {
      await fs.access(imagePath);
      if (!imagePath.endsWith('.webp')) {
        await convertToWebP(imagePath);
      }
    } catch {
      console.log(`⚠️  Image not found: ${imagePath}`);
    }
  }
  
  console.log('✨ Image conversion complete!');
}

// Run only if called directly
if (require.main === module) {
  optimizeExistingImages().catch(console.error);
}

module.exports = { convertToWebP, optimizeExistingImages };