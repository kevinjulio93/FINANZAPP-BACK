import { Storage } from '@google-cloud/storage';
import path from 'path';

export class StorageService {
    private storage: Storage;
    private bucketName: string;

    constructor() {
        this.storage = new Storage({
            keyFilename: process.env.GCS_KEY_FILE, // Ruta al archivo JSON de service account
        });
        this.bucketName = process.env.GCS_BUCKET_NAME || 'finanzas-soportes-2026';
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'soportes'): Promise<string> {
        const bucket = this.storage.bucket(this.bucketName);
        const fileName = `${folder}/${Date.now()}-${file.originalname}`;
        const blob = bucket.file(fileName);

        const blobStream = blob.createWriteStream({
            resumable: false,
            metadata: {
                contentType: file.mimetype,
            },
        });

        return new Promise((resolve, reject) => {
            blobStream.on('error', (err) => reject(err));
            blobStream.on('finish', async () => {
                // Generate signed URL valid for 24h as per spec
                // Note: In real scenarios, usually we return the direct GCS path or signed URL
                // The spec says "signed URL 24h lectura"
                const [url] = await blob.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                });
                resolve(url);
            });
            blobStream.end(file.buffer);
        });
    }
}
