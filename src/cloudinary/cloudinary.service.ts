/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
} from 'cloudinary';
import { UserService } from 'src/user/user.service';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Die Konfiguration sollte idealerweise in einem Modul oder bei der Service-Initialisierung erfolgen
@Injectable()
export class CloudinaryService {
  constructor(private userService: UserService) {}

  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      if (!file || !file.buffer) {
        return reject(new Error('Invalid file or missing buffer property.'));
      }

      let actualBuffer: Buffer;

      if (Buffer.isBuffer(file.buffer)) {
        // Fall 1: Normaler Buffer
        actualBuffer = file.buffer;
      } else if (typeof file.buffer === 'object') {
        // Fall 2: JSON-artiges Objekt, das wie Buffer aussieht
        console.log(
          'file.buffer ist ein Objekt mit Indizes. Konvertiere zu Buffer.',
        );
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const values = Object.values(file.buffer) as number[];
        actualBuffer = Buffer.from(values);
      } else if (typeof file.buffer === 'string') {
        // Fall 3: Vielleicht base64?
        console.log('file.buffer ist ein String. Versuche als base64.');
        actualBuffer = Buffer.from(file.buffer, 'base64');
      } else {
        return reject(new Error('Invalid file buffer format.'));
      }

      const mimetype = file.mimetype;
      const isImage = mimetype.startsWith('image/');

      const uploadOptions: UploadApiOptions = {
        folder,
        resource_type: 'auto',
      };

      if (isImage) {
        uploadOptions.transformation = [{ fetch_format: 'webp' }];
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error)
            return reject(
              new Error(error.message || 'Cloudinary upload failed'),
            );
          if (!result)
            return reject(new Error('No result returned from Cloudinary'));
          resolve(result);
        },
      );

      // Erstelle einen lesbaren Stream aus dem Buffer und pipe ihn zum Upload-Stream
      const readableStream = Readable.from(actualBuffer);
      readableStream.pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      void cloudinary.uploader.destroy(publicId, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  async cleanCloudProfileImages() {
    try {
      const dbPics = await this.userService.getPicture();
      let ressouces: any[] = [];
      let nextCursor: string | undefined;

      do {
        const response = await cloudinary.api.resources({
          type: 'upload',
          prefix: 'profile_prictures',
          max_results: 500,
          resource_type: 'image',
          next_cursor: nextCursor,
        });

        ressouces = [...ressouces, ...response.resources];
        nextCursor = response.next_cursor;
      } while (nextCursor);

      const cloudPics = ressouces.map((pic) => pic.public_id);
      const toDelete = cloudPics.filter(
        (pic) => !dbPics.includes(pic),
      ) as string[];

      if (toDelete.length > 0) {
        await Promise.all(toDelete.map((pic) => this.deleteFile(pic)));
      }

      // this.logger.log( `${toDelete.length} profile pictures deleted from cloudinary` );

      return {
        message: 'Profile Pictures cleaned',
        deleted: toDelete,
      };
    } catch (error) {
      // this.logger.error('Error cleaning cloudinary profile images', error);
      throw new Error('Error cleaning cloudinary profile images', {
        cause: error,
      });
    }
  }
}
