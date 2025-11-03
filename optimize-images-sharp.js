const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Image optimization configuration
const sizes = [
  { name: 'mobile', width: 480, quality: 80 },
  { name: 'tablet', width: 768, quality: 85 },
  { name: 'desktop', width: 1200, quality: 90 }
];

async function optimizeImage(inputPath, outputDir) {
  try {
    const filename = path.basename(inputPath, path.extname(inputPath));
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    
    for (const size of sizes) {
      // Generate WebP version
      await sharp(inputPath)
        .resize(size.width, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: size.quality })
        .toFile(path.join(outputDir, `${filename}-${size.name}.webp`));
      
      // Generate JPEG version
      await sharp(inputPath)
        .resize(size.width, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ 
          quality: size.quality,
          progressive: true
        })
        .toFile(path.join(outputDir, `${filename}-${size.name}.jpg`));
    }
    
    console.log(`✅ Optimized: ${filename}`);
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
  }
}

async function processDirectory(inputDir, outputDir) {
  try {
    const files = await fs.readdir(inputDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png)$/i.test(file)
    );
    
    console.log(`📁 Processing ${imageFiles.length} images in ${inputDir}`);
    
    for (const file of imageFiles) {
      await optimizeImage(
        path.join(inputDir, file), 
        outputDir
      );
    }
    
    console.log(`🎉 Completed processing ${inputDir}`);
  } catch (error) {
    console.error(`❌ Error processing directory ${inputDir}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting image optimization...');
  
  // Process blog images
  await processDirectory('./assets/blog', './assets/blog');
  
  // Process OG images
  await processDirectory('./assets/og', './assets/og');
  
  console.log('✨ Image optimization complete!');
  console.log('📊 Expected savings: 60-80% file size reduction');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { optimizeImage, processDirectory };