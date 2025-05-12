/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto', // Automatically detect the resource type (image, video, etc.)
        },
        (error, result) => {
          if (error) return reject(new Error(error.message || String(error)));
          resolve(result as UploadApiResponse);
        },
      );

      if (file && file.buffer) {
        streamifier.createReadStream(file.buffer).pipe(stream);
      } else {
        reject(new Error('Invalid file or missing buffer property.'));
      }
    });
  }
}
