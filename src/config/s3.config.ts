import { registerAs } from '@nestjs/config';
export default registerAs('s3', () => ({
  endpoint: process.env.S3_ENDPOINT, // e.g., s3.us-west-000.backblazeb2.com
  region: process.env.S3_REGION, // e.g., us-west-000
  accessKeyId: process.env.S3_APP_KEY_ID,
  secretAccessKey: process.env.S3_APP_KEY_SECRET,
  bucket: process.env.S3_BUCKET_NAME,
  publicUrlBase: process.env.S3_PUBLIC_URL_BASE, // e.g., https://your-bucket-name.s3.us-west-000.backblazeb2.com
}));
