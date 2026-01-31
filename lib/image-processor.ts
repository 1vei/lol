import sharp from 'sharp'

export async function processImage(buffer: Buffer, maxWidth = 1920): Promise<Buffer> {
  return sharp(buffer)
    .resize(maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ 
      quality: 92,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer() as Promise<Buffer>
}

export async function processThumbnail(buffer: Buffer, size = 400): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ 
      quality: 90,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer() as Promise<Buffer>
}

export async function processImageAggressive(buffer: Buffer, maxWidth = 1600): Promise<Buffer> {
  return sharp(buffer)
    .resize(maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ 
      quality: 90,
      effort: 6,
      smartSubsample: true,
      nearLossless: false,
    })
    .toBuffer() as Promise<Buffer>
}
