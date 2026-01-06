
export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Mix color with white (tint) or black (shade)
const mix = (color: {r: number, g: number, b: number}, mixColor: {r: number, g: number, b: number}, weight: number) => {
  return {
    r: Math.round(color.r * (1 - weight) + mixColor.r * weight),
    g: Math.round(color.g * (1 - weight) + mixColor.g * weight),
    b: Math.round(color.b * (1 - weight) + mixColor.b * weight)
  };
};

const rgbToHex = (rgb: {r: number, g: number, b: number}) => {
  return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
};

export const generatePalette = (baseHex: string) => {
  const rgb = hexToRgb(baseHex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    50: rgbToHex(mix(rgb, white, 0.95)),
    100: rgbToHex(mix(rgb, white, 0.9)),
    200: rgbToHex(mix(rgb, white, 0.75)),
    300: rgbToHex(mix(rgb, white, 0.6)),
    400: rgbToHex(mix(rgb, white, 0.3)),
    500: baseHex, // Base color is usually 500 or 600. Let's assume input is the primary brand color (approx 600)
    600: baseHex, // We'll use the input as 600 for strong contrast
    700: rgbToHex(mix(rgb, black, 0.1)),
    800: rgbToHex(mix(rgb, black, 0.2)),
    900: rgbToHex(mix(rgb, black, 0.3)),
  };
};

export const extractDominantColor = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve('#2563eb'); // Default fallback
                return;
            }
            
            // Resize to 1x1 to get average color
            canvas.width = 1;
            canvas.height = 1;
            ctx.drawImage(img, 0, 0, 1, 1);
            
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            resolve(rgbToHex({ r, g, b }));
        };

        img.onerror = () => {
            // Resolve with default blue instead of rejecting to avoid unhandled promise rejections
            // or noisy console errors.
            resolve('#2563eb');
        };

        // Set src after handlers are defined to avoid race conditions
        img.src = imageSrc;
    });
};

export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const elem = document.createElement('canvas');
                // Set max width/height to avoid huge local storage usage. 
                const maxWidth = 1920; 
                const maxHeight = 1080;
                let width = img.width;
                let height = img.height;

                // Aspect Ratio Logic
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                
                ctx.drawImage(img, 0, 0, width, height);
                // Compress as JPEG with 0.8 quality
                resolve(elem.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
