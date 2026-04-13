import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFile(
  file: File,
  folder: string = 'bac-platform'
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const isPdf = file.type === 'application/pdf';
  const resourceType = isPdf ? 'raw' : 'image';

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
          allowed_formats: isPdf ? ['pdf'] : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          max_bytes: 5 * 1024 * 1024,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      )
      .end(buffer);
  });
}

export default cloudinary;
