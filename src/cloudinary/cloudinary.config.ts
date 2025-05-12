import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  // wir verwenden hier keine config.get da wir sonst einen namenskonflikt mit dem config service haben
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
