/**
 * Script to sync icons from resources folder to Android mipmap folders
 * Run this after updating the icon.png file
 */

const fs = require('fs');
const path = require('path');

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

console.log('Icon sync script - This requires sharp or jimp to resize images.');
console.log('For now, please use Android Studio or a tool like Image Asset Studio to generate icons.');
console.log('\nTo fix icons:');
console.log('1. Open Android Studio');
console.log('2. Right-click on res folder > New > Image Asset');
console.log('3. Select your icon.png from resources/icon.png');
console.log('4. Generate all densities');
console.log('\nOr use online tools like:');
console.log('- https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html');
console.log('- https://www.appicon.co/');

// Check if source icon exists
if (fs.existsSync(sourceIcon)) {
  console.log(`\n✓ Source icon found: ${sourceIcon}`);
} else {
  console.log(`\n✗ Source icon not found: ${sourceIcon}`);
  console.log('Please ensure resources/icon.png exists');
}

