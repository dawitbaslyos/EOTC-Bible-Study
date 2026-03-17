/**
 * Icon Generation Script for Android (ESM-compatible)
 * This script helps generate Android icons from the source icon.png
 *
 * IMPORTANT: This requires sharp package. Install it first:
 *   npm install --save-dev sharp
 *
 * Then run:
 *   node scripts/generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname replacement in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIcon = path.join(__dirname, '../resources/icon.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

// Android density folders and their sizes
const densities = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function generateIcons() {
  try {
    // Dynamically import sharp in ESM
    let sharp;
    try {
      const sharpModule = await import('sharp');
      sharp = sharpModule.default || sharpModule;
    } catch (err) {
      console.error('❌ Sharp package not found!');
      console.log('\n📦 Please install sharp first:');
      console.log('   npm install --save-dev sharp\n');
      console.log('📖 Or use Android Studio Image Asset Studio:');
      console.log('   1. Open Android Studio');
      console.log('   2. Right-click app/src/main/res → New → Image Asset');
      console.log('   3. Select resources/icon.png');
      console.log('   4. Generate all densities\n');
      return;
    }

    // Check if source icon exists
    if (!fs.existsSync(sourceIcon)) {
      console.error(`❌ Source icon not found: ${sourceIcon}`);
      console.log('   Please ensure resources/icon.png exists');
      return;
    }

    console.log('🎨 Generating Android icons...\n');

    // Create directories and generate icons
    for (const [folder, size] of Object.entries(densities)) {
      const folderPath = path.join(androidResPath, folder);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const outputPath = path.join(folderPath, 'ic_launcher.png');
      
      try {
        await sharp(sourceIcon)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 10, g: 10, b: 12, alpha: 1 }
          })
          .png()
          .toFile(outputPath);
        
        console.log(`✅ Generated ${folder}/ic_launcher.png (${size}x${size})`);
      } catch (err) {
        console.error(`❌ Failed to generate ${folder}:`, err.message);
      }
    }

    // Also generate foreground for adaptive icons
    console.log('\n📱 Generating adaptive icon foregrounds...');
    for (const [folder, size] of Object.entries(densities)) {
      const folderPath = path.join(androidResPath, folder);
      const outputPath = path.join(folderPath, 'ic_launcher_foreground.png');
      
      try {
        await sharp(sourceIcon)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(outputPath);
        
        console.log(`✅ Generated ${folder}/ic_launcher_foreground.png`);
      } catch (err) {
        console.error(`❌ Failed to generate foreground ${folder}:`, err.message);
      }
    }

    console.log('\n✨ Icon generation complete!');
    console.log('📝 Next steps:');
    console.log('   1. Run: npm run cap:sync');
    console.log('   2. Build APK: npm run android:build');
    console.log('   3. Icons should now appear in your APK!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative: Use Android Studio Image Asset Studio');
    console.log('   See ICON_SETUP.md for detailed instructions\n');
  }
}

generateIcons();

