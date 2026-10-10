import mongoose from 'mongoose';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const BUCKET = 'agentImages';

interface PutFileOptions {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

export function getBucket() {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB is not connected');
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });
}

export async function putFile({ buffer, filename, contentType }: PutFileOptions) {
  const bucket = getBucket();
  const upload = bucket.openUploadStream(filename, { contentType });
  await pipeline(Readable.from(buffer), upload);
  return upload.id;
}

export function openDownload(fileId: string | mongoose.Types.ObjectId) {
  return getBucket().openDownloadStream(new mongoose.Types.ObjectId(String(fileId)));
}

export async function deleteFile(fileId: string | mongoose.Types.ObjectId) {
  try {
    await getBucket().delete(new mongoose.Types.ObjectId(String(fileId)));
  } catch (cause) {
    const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : undefined;
    const message = cause instanceof Error ? cause.message : undefined;
    if (code !== 'ENOENT' && message !== 'FileNotFound') {
      throw cause;
    }
  }
}

export function looksLikeImage(buffer: Buffer, contentType: string): boolean {
  if (!buffer || buffer.length < 12) return false;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const webp =
    buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (contentType === 'image/jpeg') return jpeg;
  if (contentType === 'image/png') return png;
  if (contentType === 'image/webp') return webp;
  return jpeg || png || webp;
}
