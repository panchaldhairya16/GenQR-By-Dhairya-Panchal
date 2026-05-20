import QRCode from 'qrcode';

interface DrawOptions {
  text: string;
  fgColor: string;
  bgColor: string;
  size: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  logoUrl: string | null;
  logoScale: number;
}

/**
 * Loads an image from a URL or base64 data stream.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Avoid tainted canvases for external URLs if possible
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load logo image: ' + String(e)));
    img.src = url;
  });
}

/**
 * Generates QR code as a high-quality Canvas element and draws a central logo if provided.
 */
export async function generateQRCanvas(options: DrawOptions): Promise<HTMLCanvasElement> {
  const { text, fgColor, bgColor, size, margin, errorCorrectionLevel, logoUrl, logoScale } = options;

  // Create an offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  // Draw the base QR Code using the qrcode library
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: margin,
    color: {
      dark: fgColor,
      light: bgColor
    },
    errorCorrectionLevel: errorCorrectionLevel,
  });

  // Inject logo if provided
  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Calculate dimensions
        const logoSize = size * logoScale;
        const x = (size - logoSize) / 2;
        const y = (size - logoSize) / 2;

        // Draw a clean background badge for the logo (helps scannability)
        const pad = logoSize * 0.15; // 15% padding
        ctx.fillStyle = bgColor;
        
        // Draw rounded rectangle for logo background
        ctx.beginPath();
        const rx = x - pad;
        const ry = y - pad;
        const rw = logoSize + pad * 2;
        const rh = logoSize + pad * 2;
        const radius = pad * 1.5;
        
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        ctx.lineTo(rx + rw, ry + rh - radius);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
        ctx.lineTo(rx + radius, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.fill();

        // Draw a subtle border around the badge to pop from QR modules
        ctx.strokeStyle = fgColor + '3F'; // 25% opacity of QR color
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Clip and draw logo inside the badge
        ctx.save();
        ctx.beginPath();
        // Rounded crop for logo
        const logoRadius = pad;
        ctx.moveTo(x + logoRadius, y);
        ctx.lineTo(x + logoSize - logoRadius, y);
        ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + logoRadius);
        ctx.lineTo(x + logoSize, y + logoSize - logoRadius);
        ctx.quadraticCurveTo(x + logoSize, y + logoSize, x + logoSize - logoRadius, y + logoSize);
        ctx.lineTo(x + logoRadius, y + logoSize);
        ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - logoRadius);
        ctx.lineTo(x, y + logoRadius);
        ctx.quadraticCurveTo(x, y, x + logoRadius, y);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(logo, x, y, logoSize, logoSize);
        ctx.restore();
      }
    } catch (err) {
      console.warn('Could not draw central logo onto canvas:', err);
      // Fallback: Return QR canvas without logo, or let the exception propagate if desired.
    }
  }

  return canvas;
}

/**
 * Generates customized QR code as SVG XML text string, with central logo tag embedded if selected.
 */
export async function generateQRSVG(options: DrawOptions): Promise<string> {
  const { text, fgColor, bgColor, size, margin, errorCorrectionLevel, logoUrl, logoScale } = options;

  // Generate pure raw SVG string via library
  let svgString = await QRCode.toString(text, {
    type: 'svg',
    width: size,
    margin: margin,
    color: {
      dark: fgColor,
      light: bgColor
    },
    errorCorrectionLevel: errorCorrectionLevel,
  });

  // Inject SVG content adjustments if logo exists
  if (logoUrl) {
    try {
      // Calculate layout coordinates
      const logoSize = size * logoScale;
      const x = (size - logoSize) / 2;
      const y = (size - logoSize) / 2;
      const pad = logoSize * 0.12;

      // Create an SVG-compatible XML injection
      const backgroundRect = `<rect x="${x - pad}" y="${y - pad}" width="${logoSize + pad * 2}" height="${logoSize + pad * 2}" rx="${pad * 1.5}" fill="${bgColor}" stroke="${fgColor}" stroke-opacity="0.2" stroke-width="1.5" />`;
      
      const logoElement = `<g><image href="${escapeXml(logoUrl)}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" clip-path="inset(0% round ${pad}px)" /></g>`;

      const injection = `\n${backgroundRect}\n${logoElement}\n</svg>`;
      
      // Inject right before closing </svg>
      svgString = svgString.replace('</svg>', injection);
    } catch (err) {
      console.warn('Could not inject logo into SVG:', err);
    }
  }

  return svgString;
}

/**
 * Escapes values for XML injection
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
