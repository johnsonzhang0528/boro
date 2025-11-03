const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Simple batch converter for all images
async function convertAllImages() {
  const { glob } = await import('glob');
  
  console.log('🚀 Converting all images to WebP...');
  
  const patterns = [
    './assets/blog/**/*.{jpg,jpeg,png}',
    './assets/og/**/*.{jpg,jpeg,png}'
  ];
  
  let totalConverted = 0;
  
  for (const pattern of patterns) {
    const files = await glob(pattern);
    
    for (const filePath of files) {
      try {
        const dir = path.dirname(filePath);
        const name = path.basename(filePath, path.extname(filePath));
        const webpPath = path.join(dir, `${name}.webp`);
        
        // Check if WebP already exists
        try {
          await fs.access(webpPath);
          console.log(`⏭️  WebP exists: ${webpPath}`);
          continue;
        } catch {
          // Create WebP version
        }
        
        await sharp(filePath)
          .webp({ 
            quality: 85,
            effort: 6 
          })
          .toFile(webpPath);
          
        console.log(`✅ Created: ${webpPath}`);
        totalConverted++;
      } catch (error) {
        console.error(`❌ Error: ${filePath} - ${error.message}`);
      }
    }
  }
  
  console.log(`✨ Converted ${totalConverted} images to WebP!`);
}

// Quick single file converter
async function convertSingleImage(imagePath) {
  if (!imagePath) {
    console.log('Usage: node convert-to-webp.js [image-path]');
    console.log('Or run without arguments to convert all images');
    return;
  }
  
  try {
    const dir = path.dirname(imagePath);
    const name = path.basename(imagePath, path.extname(imagePath));
    const webpPath = path.join(dir, `${name}.webp`);
    
    await sharp(imagePath)
      .webp({ quality: 85, effort: 6 })
      .toFile(webpPath);
      
    console.log(`✅ Created: ${webpPath}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Run from command line
if (require.main === module) {
  const imagePath = process.argv[2];
  
  if (imagePath) {
    convertSingleImage(imagePath).catch(console.error);
  } else {
    convertAllImages().catch(console.error);
  }
}

module.exports = { convertAllImages, convertSingleImage };