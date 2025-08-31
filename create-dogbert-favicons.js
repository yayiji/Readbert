import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createDogbertFavicons() {
  const sourcePath = path.join(__dirname, 'static', 'dogbert.png');
  const staticDir = path.join(__dirname, 'static');
  
  try {
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.error('❌ Source file dogbert.png not found in static folder');
      return;
    }
    
    console.log('🐕 Creating Dogbert favicons... The evil genius approves!');
    
    // Create favicon.png (32x32) - the main favicon
    await sharp(sourcePath)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(staticDir, 'favicon.png'));
    
    // Create favicon-16.png (16x16) - for older browsers
    await sharp(sourcePath)
      .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(staticDir, 'favicon-16.png'));
    
    // Create apple-touch-icon (180x180) - for iOS devices
    await sharp(sourcePath)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(staticDir, 'apple-touch-icon.png'));
    
    // Create favicon-192.png (192x192) - for Android devices
    await sharp(sourcePath)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(staticDir, 'favicon-192.png'));
    
    // Create favicon-512.png (512x512) - for high-res displays
    await sharp(sourcePath)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(staticDir, 'favicon-512.png'));
    
    console.log('✅ Dogbert favicon files created successfully!');
    console.log('🎯 The evil genius now rules your browser tabs:');
    console.log('- favicon.png (32x32) - Main Dogbert favicon');
    console.log('- favicon-16.png (16x16) - Mini Dogbert for legacy browsers');
    console.log('- apple-touch-icon.png (180x180) - Dogbert conquers iOS');
    console.log('- favicon-192.png (192x192) - Dogbert dominates Android');
    console.log('- favicon-512.png (512x512) - High-res Dogbert supremacy');
    
  } catch (error) {
    console.error('❌ Error creating Dogbert favicons:', error);
  }
}

createDogbertFavicons();
