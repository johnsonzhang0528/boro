const chokidar = require('chokidar');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageWatcher {
  constructor() {
    this.watchPaths = [
      './assets/blog/**/*.{jpg,jpeg,png}',
      './assets/og/**/*.{jpg,jpeg,png}'
    ];
  }

  async convertToWebP(filePath) {
    try {
      const dir = path.dirname(filePath);
      const name = path.basename(filePath, path.extname(filePath));
      const webpPath = path.join(dir, `${name}.webp`);
      
      // Check if WebP already exists and is newer
      try {
        const [originalStat, webpStat] = await Promise.all([
          fs.stat(filePath),
          fs.stat(webpPath)
        ]);
        
        if (webpStat.mtime > originalStat.mtime) {
          console.log(`⏭️  WebP is up to date: ${webpPath}`);
          return;
        }
      } catch {
        // WebP doesn't exist, create it
      }

      await sharp(filePath)
        .webp({ 
          quality: 85,
          effort: 6 
        })
        .toFile(webpPath);
        
      console.log(`✅ Created/Updated WebP: ${webpPath}`);
    } catch (error) {
      console.error(`❌ Error converting ${filePath}:`, error.message);
    }
  }

  async processExistingImages() {
    console.log('🔍 Scanning for existing images...');
    
    const { glob } = await import('glob');
    
    for (const pattern of this.watchPaths) {
      const files = await glob(pattern);
      
      for (const file of files) {
        await this.convertToWebP(file);
      }
    }
    
    console.log('📸 Existing images processed!');
  }

  startWatching() {
    console.log('👀 Starting image watcher...');
    
    const watcher = chokidar.watch(this.watchPaths, {
      ignored: /\.webp$/,
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', async (filePath) => {
        console.log(`📁 New image detected: ${filePath}`);
        await this.convertToWebP(filePath);
      })
      .on('change', async (filePath) => {
        console.log(`🔄 Image updated: ${filePath}`);
        await this.convertToWebP(filePath);
      })
      .on('error', error => console.log(`Watcher error: ${error}`));

    console.log('✅ Image watcher is running!');
    console.log('📝 Add any .jpg or .png files to assets/blog/ or assets/og/ and they will be auto-converted to WebP');
    
    return watcher;
  }
}

// Export for use in other scripts
module.exports = ImageWatcher;

// Run directly
if (require.main === module) {
  const watcher = new ImageWatcher();
  
  // Process existing images first
  watcher.processExistingImages()
    .then(() => {
      // Start watching for new images
      watcher.startWatching();
    })
    .catch(console.error);
}