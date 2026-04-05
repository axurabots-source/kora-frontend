export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    // Only set crossOrigin if the URL is not a data/blob URL
    if (url && !url.startsWith('data:') && !url.startsWith('blob:')) {
      image.setAttribute('crossOrigin', 'anonymous')
    }
    image.src = url
  })

export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // set canvas size to match the bounding box
  canvas.width = image.width
  canvas.height = image.height
  ctx.drawImage(image, 0, 0)

  // Target avatar size constraint
  const TARGET_SIZE = 128
  
  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) {
    return null
  }

  // Compress and resize the avatar to ensure it fits perfectly in Supabase user_metadata
  croppedCanvas.width = TARGET_SIZE
  croppedCanvas.height = TARGET_SIZE

  // Draw the cropped image onto the downscaled canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    TARGET_SIZE,
    TARGET_SIZE
  )

  return new Promise((resolve) => {
    // Generate heavily compressed Base64 JPEG
    const base64Image = croppedCanvas.toDataURL('image/jpeg', 0.6)
    resolve(base64Image)
  })
}
