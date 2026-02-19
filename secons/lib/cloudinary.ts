import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Uploads an image to Cloudinary.
 * @param buffer The file buffer to upload.
 * @param folder The folder to upload to (e.g., 'avatars').
 * @param filename The desired filename (optional, Cloudinary generates one otherwise).
 */
export const uploadImage = async (buffer: Buffer, folder: string, filename?: string) => {
    return new Promise<{ url: string; public_id: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: `secons/${folder}`,
                public_id: filename,
                resource_type: 'image',
                format: 'webp', // Convert to WebP for optimization
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) {
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                    });
                }
            }
        ).end(buffer);
    });
};

/**
 * Deletes an image from Cloudinary.
 * @param publicId The public ID of the image to delete.
 */
export const deleteImage = async (publicId: string) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw error;
    }
};

export default cloudinary;
