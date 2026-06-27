import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = '505d2a36e8a47ba9a16e346065eea635';

export class StorageService {
    private s3: S3Client;
    private bucketName: string;

    constructor() {
        this.s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
        });
        this.bucketName = process.env.R2_BUCKET_NAME || 'finanzapp';
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'soportes'): Promise<string> {
        return this.uploadBuffer(file.buffer, file.originalname, file.mimetype, folder);
    }

    async uploadBuffer(buffer: Buffer, originalName: string, mimeType: string, folder: string = 'soportes'): Promise<string> {
        const key = `${folder}/${Date.now()}-${originalName}`;

        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }));

        const url = await getSignedUrl(this.s3, new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        }), { expiresIn: 86400 });

        return url;
    }

    /**
     * Deletes a file from R2 given its signed URL.
     * Extracts the object key from the URL and sends a DeleteObjectCommand.
     */
    async deleteFileByUrl(signedUrl: string): Promise<void> {
        try {
            const key = this.extractKeyFromUrl(signedUrl);
            if (!key) {
                console.warn('Could not extract key from URL:', signedUrl);
                return;
            }

            await this.s3.send(new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }));
        } catch (error) {
            console.error('Failed to delete file from R2:', error);
        }
    }

    /**
     * Extracts the S3 object key from a signed R2 URL.
     * URL format: https://{accountId}.r2.cloudflarestorage.com/{bucket}/{key}?...
     */
    private extractKeyFromUrl(url: string): string | null {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            // pathParts: [bucketName, folder, filename]
            // The key is everything after the bucket name
            if (pathParts.length >= 2) {
                return pathParts.slice(1).join('/');
            }
            return null;
        } catch {
            return null;
        }
    }
}
