const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'assets');
const SIZES = [16, 32, 48, 64, 128, 256];

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function hexToRgb(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function mix(a, b, t) {
  return a.map((value, index) => value + (b[index] - value) * t);
}

function blend(buffer, size, x, y, color, alpha = 1) {
  if (x < 0 || y < 0 || x >= size || y >= size || alpha <= 0) {
    return;
  }

  const index = (y * size + x) * 4;
  const dstAlpha = buffer[index + 3] / 255;
  const outAlpha = alpha + dstAlpha * (1 - alpha);

  for (let i = 0; i < 3; i += 1) {
    const dst = buffer[index + i];
    buffer[index + i] = clamp((color[i] * alpha + dst * dstAlpha * (1 - alpha)) / Math.max(outAlpha, 0.001));
  }

  buffer[index + 3] = clamp(outAlpha * 255);
}

function signedRoundedRectDistance(px, py, cx, cy, halfWidth, halfHeight, radius) {
  const qx = Math.abs(px - cx) - halfWidth + radius;
  const qy = Math.abs(py - cy) - halfHeight + radius;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - radius;
}

function drawIcon(size) {
  const scale = 3;
  const large = size * scale;
  const buffer = Buffer.alloc(large * large * 4);
  const bgStart = hexToRgb('#193238');
  const bgEnd = hexToRgb('#0f1b1e');
  const wardStart = hexToRgb('#2b555d');
  const wardEnd = hexToRgb('#13272b');
  const teal = hexToRgb('#30c8a6');
  const amber = hexToRgb('#f2bf4d');
  const dark = hexToRgb('#10191c');

  for (let y = 0; y < large; y += 1) {
    for (let x = 0; x < large; x += 1) {
      const nx = (x + 0.5) / large;
      const ny = (y + 0.5) / large;
      const px = nx * 256;
      const py = ny * 256;
      const bgDistance = signedRoundedRectDistance(px, py, 128, 128, 116, 116, 52);

      if (bgDistance < 0) {
        blend(buffer, large, x, y, mix(bgStart, bgEnd, (nx + ny) / 2), 1);

        if (bgDistance > -7) {
          blend(buffer, large, x, y, teal, 0.45);
        }
      }

      const diamondDistance = Math.abs(px - 128) + Math.abs(py - 128) - 94;
      if (diamondDistance < 0) {
        blend(buffer, large, x, y, mix(wardStart, wardEnd, (nx + ny) / 2), 0.95);

        if (diamondDistance > -7) {
          blend(buffer, large, x, y, teal, 0.72);
        }
      }

      const innerDiamondDistance = Math.abs(px - 128) + Math.abs(py - 128) - 56;
      if (innerDiamondDistance > -5 && innerDiamondDistance < 1) {
        blend(buffer, large, x, y, amber, 0.36);
      }

      const sideGate = (cx) => Math.abs(px - cx) + Math.abs(py - 128) - 29;
      for (const cx of [68, 188]) {
        const gateDistance = sideGate(cx);
        if (gateDistance < 0) {
          blend(buffer, large, x, y, amber, 0.98);
        }
      }

      const coreDistance = Math.hypot(px - 128, py - 128);
      if (coreDistance < 58 && coreDistance >= 42) {
        blend(buffer, large, x, y, teal, 0.12 * (1 - (coreDistance - 42) / 16));
      }
      if (coreDistance < 42) {
        blend(buffer, large, x, y, teal, 1);
      }
      if (coreDistance < 22) {
        blend(buffer, large, x, y, dark, 0.85);
      }
    }
  }

  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sums = [0, 0, 0, 0];
      for (let yy = 0; yy < scale; yy += 1) {
        for (let xx = 0; xx < scale; xx += 1) {
          const index = ((y * scale + yy) * large + (x * scale + xx)) * 4;
          for (let channel = 0; channel < 4; channel += 1) {
            sums[channel] += buffer[index + channel];
          }
        }
      }
      const outIndex = (y * size + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        out[outIndex + channel] = clamp(sums[channel] / (scale * scale));
      }
    }
  }

  return {
    png: encodePng(size, out),
    rgba: out,
  };
}

function encodePng(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function encodeDib(size, rgba) {
  const maskRowSize = Math.ceil(size / 32) * 4;
  const xorSize = size * size * 4;
  const maskSize = maskRowSize * size;
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8);
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(xorSize + maskSize, 20);
  header.writeInt32LE(0, 24);
  header.writeInt32LE(0, 28);
  header.writeUInt32LE(0, 32);
  header.writeUInt32LE(0, 36);

  const pixels = Buffer.alloc(xorSize);
  for (let y = 0; y < size; y += 1) {
    const sourceY = size - 1 - y;
    for (let x = 0; x < size; x += 1) {
      const sourceIndex = (sourceY * size + x) * 4;
      const targetIndex = (y * size + x) * 4;
      pixels[targetIndex] = rgba[sourceIndex + 2];
      pixels[targetIndex + 1] = rgba[sourceIndex + 1];
      pixels[targetIndex + 2] = rgba[sourceIndex];
      pixels[targetIndex + 3] = rgba[sourceIndex + 3];
    }
  }

  return Buffer.concat([header, pixels, Buffer.alloc(maskSize)]);
}

function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = [];
  for (const image of images) {
    const dib = encodeDib(image.size, image.rgba);
    const entry = Buffer.alloc(16);
    entry[0] = image.size === 256 ? 0 : image.size;
    entry[1] = image.size === 256 ? 0 : image.size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(dib.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    image.dib = dib;
    offset += dib.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.dib)]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const images = SIZES.map((size) => {
  const image = drawIcon(size);
  const png = image.png;
  fs.writeFileSync(path.join(OUT_DIR, `icon-${size}.png`), png);
  return { size, png, rgba: image.rgba };
});

fs.copyFileSync(path.join(OUT_DIR, 'icon-256.png'), path.join(OUT_DIR, 'icon.png'));
fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), encodeIco(images));
console.log(`Generated ${images.length} PNG icons and icon.ico in ${OUT_DIR}`);
