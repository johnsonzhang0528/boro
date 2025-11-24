require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
// const fetch = require('node-fetch'); // node-fetch v3 is ESM-only
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const sharp = require('sharp'); // Import sharp for image conversion

// Configuration
const STABILITY_API_KEY = process.env.STABILITY_API_KEY; // Ensure this is set in your environment
const BLOG_DIR = 'blog';
const ASSETS_DIR = 'assets';
const ENGINE_ID = 'stable-diffusion-xl-1024-v1-0'; // SDXL 1.0
const API_HOST = 'https://api.stability.ai';

if (!STABILITY_API_KEY) {
    console.error('❌ Error: STABILITY_API_KEY environment variable is not set.');
    process.exit(1);
}

async function main() {
    console.log('🚀 Starting image generation script (Stability AI)...');

    // 1. Identify the target file (most recently modified markdown file in blog/)
    const files = await glob(`${BLOG_DIR}/*.md`);
    if (files.length === 0) {
        console.error('❌ No markdown files found in blog directory.');
        process.exit(1);
    }

    const targetFile = files
        .map(file => ({ file, mtime: fs.statSync(file).mtime }))
        .sort((a, b) => b.mtime - a.mtime)[0].file;

    console.log(`📝 Target file identified: ${targetFile}`);

    const content = fs.readFileSync(targetFile, 'utf8');

    // 2. Extract Prompts and Filenames
    // We need a way to map prompts to filenames.
    // Since prompts are provided in the chat and not in the file, 
    // we need a structured way to input them here.
    //
    // OPTION 1: Read from a temporary JSON file (e.g., prompts.json)
    // OPTION 2: Parse a specific comment block in the MD file (if we added one)
    //
    // Let's go with OPTION 1 for cleaner separation as discussed.
    // The user (Agent) should create a 'prompts.json' file before running this script.
    
    const promptsFile = 'prompts.json';
    if (!fs.existsSync(promptsFile)) {
        console.error(`❌ Error: ${promptsFile} not found. Please create it with the prompts.`);
        console.log(`
Example prompts.json format:
[
  {
    "filename": "assets/blog/my-image.png",
    "prompt": "A futuristic city with neon lights..."
  },
  {
    "filename": "assets/og/my-og-image.png",
    "prompt": "An abstract representation of AI..."
  }
]
`);
        process.exit(1);
    }

    const tasks = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));

    for (const task of tasks) {
        const { filename, prompt } = task;
        
        // Ensure directory exists
        const dir = path.dirname(filename);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Check if file already exists to avoid re-generating (saving money!)
        if (fs.existsSync(filename)) {
            console.log(`⚠️  File ${filename} already exists. Skipping generation.`);
            continue;
        }

        console.log(`🎨 Generating: ${filename}`);
        console.log(`   Prompt: ${prompt.substring(0, 50)}...`);

        try {
            const response = await fetch(
                `${API_HOST}/v1/generation/${ENGINE_ID}/text-to-image`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${STABILITY_API_KEY}`,
                    },
                    body: JSON.stringify({
                        text_prompts: [
                            {
                                text: prompt,
                            },
                        ],
                        cfg_scale: 7,
                        height: 1024,
                        width: 1024, // SDXL supports various aspect ratios, 1024x1024 is standard cost
                        samples: 1,
                        steps: 30,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`Non-200 response: ${await response.text()}`);
            }

            const responseJSON = await response.json();

            for (const image of responseJSON.artifacts) {
                // Convert PNG buffer to WebP using sharp
                const pngBuffer = Buffer.from(image.base64, 'base64');
                
                // If the filename ends with .webp, we convert. 
                // If user still wants .png, we respect it (or we can force webp).
                // Let's force conversion if the target filename is .webp, otherwise save as is.
                
                if (filename.endsWith('.webp')) {
                    await sharp(pngBuffer)
                        .webp({ quality: 80 }) // Adjust quality as needed
                        .toFile(filename);
                } else {
                    // Fallback for non-webp extensions (e.g. .png)
                    fs.writeFileSync(filename, pngBuffer);
                }
                
                console.log(`   ✅ Saved to ${filename}`);
            }

        } catch (error) {
            console.error(`   ❌ Failed to generate ${filename}:`, error.message);
            // Strict Mode: Exit immediately on error to prevent publishing incomplete posts
            process.exit(1);
        }
    }
    
    console.log('✨ All image generation tasks completed.');
}

main();
