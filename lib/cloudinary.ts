import "server-only";

import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


export async function uploadFileToCloudinary(file: File, options: UploadApiOptions): Promise<UploadApiResponse | undefined> {
    const imageBuffer = Buffer.from(await file.arrayBuffer());

    return await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(options, (error, uploadResult) => {
            if (error) {
                return reject(error);
            }
            return resolve(uploadResult);
        }).end(imageBuffer);
    })
}