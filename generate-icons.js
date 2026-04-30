import fs from 'fs';
import path from 'path';
import { Jimp } from 'jimp';

async function generateIcons() {
  const publicDir = path.join(process.cwd(), 'public');
  const sourcePath = path.join(publicDir, 'app-icon-512.png');
  const icon192Path = path.join(publicDir, 'app-icon-192.png');
  const tempSourcePath = path.join(publicDir, 'app-icon-source-temp.png');

  try {
    if (!fs.existsSync(sourcePath)) {
      console.log('No source icon found at', sourcePath);
      return;
    }

    console.log('Reading source icon...');
    // We read it into a buffer to avoid locking issues, then process it
    const image = await Jimp.read(sourcePath);
    
    // We want to generate a 512x512 and a 192x192 icon out of the provided image.
    // However, the provided image is already named 'app-icon-512.png'.
    // If it is NOT 512x512, we will resize it IN PLACE to 512x512.
    // And we will also generate app-icon-192.png.
    
    // Check if we need to resize to ensure square dimensions or exact sizes
    const needResize = image.width !== 512 || image.height !== 512;
    
    if (needResize) {
       console.log(`Source is ${image.width}x${image.height}. Resizing to 512x512 and 192x192...`);
       // Let's create an exact 512x512 version. 
       // Jimp.resize directly? Actually, `cover` is better if it's not square.
       const img512 = image.clone();
       img512.cover({ w: 512, h: 512 });
       await img512.write(sourcePath);
       
       const img192 = img512.clone();
       img192.resize({ w: 192, h: 192 });
       await img192.write(icon192Path);
    } else {
       console.log('Source is already 512x512. Just generating 192x192...');
       const img192 = image.clone();
       img192.resize({ w: 192, h: 192 });
       await img192.write(icon192Path);
    }
    
    console.log('Icons generated successfully.');
  } catch (err) {
    console.error('Failed to generate icons:', err);
  }
}

generateIcons();
