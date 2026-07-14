import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = (process.env.R2_ACCOUNT_ID || '505d2a36e8a47ba9a16e346065eea635').trim();
const R2_REGION = (process.env.R2_REGION || 'auto').trim();

export class StorageService {
    private s3: S3Client;
    private bucketName: string;

    constructor() {
        const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim();
        const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();

        this.s3 = new S3Client({
            region: R2_REGION,
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            forcePathStyle: true,
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        this.bucketName = (process.env.R2_BUCKET_NAME || 'finanzapp').trim();
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
     * Uploads a buffer directly to an exact key path (no timestamp prefix).
     * Used for uploading directly to structured paths like {category}/{year}/{service}/{month}/{file}.
     */
    async uploadToKey(buffer: Buffer, key: string, mimeType: string): Promise<string> {
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }));

        return getSignedUrl(this.s3, new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        }), { expiresIn: 86400 });
    }

    /**
     * Copies a file within R2 to a new structured path and deletes the original.
     * Uses CopyObjectCommand (server-side copy, no download/re-upload).
     * Returns the new signed URL for the moved file.
     */
    async moveFile(sourceUrl: string, destKey: string): Promise<string> {
        // Extract the source key from the signed URL
        const sourceKey = this.extractKeyFromUrl(sourceUrl);
        if (!sourceKey) {
            throw new Error('Could not extract source key from URL');
        }

        // Infer content type from file extension
        const ext = destKey.split('.').pop()?.toLowerCase() || '';
        const mimeType = this.getMimeType(ext);

        // Copy directly within R2 (server-side, no download)
        await this.s3.send(new CopyObjectCommand({
            CopySource: `${this.bucketName}/${sourceKey}`,
            Bucket: this.bucketName,
            Key: destKey,
            MetadataDirective: 'REPLACE',
            ContentType: mimeType,
        }));

        // Generate new signed URL
        const newUrl = await getSignedUrl(this.s3, new GetObjectCommand({
            Bucket: this.bucketName,
            Key: destKey,
        }), { expiresIn: 86400 });

        // Delete original file
        await this.s3.send(new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: sourceKey,
        }));

        return newUrl;
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
     * Generates a fresh signed URL for a given object key.
     * Used to refresh expired URLs when serving files to the frontend.
     */
    async getSignedUrl(key: string): Promise<string> {
        return getSignedUrl(this.s3, new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        }), { expiresIn: 86400 });
    }

    /**
     * Extracts the S3 object key from a signed R2 URL.
     * Handles both virtual-hosted style (bucket in hostname) and path-style (bucket in path).
     *
     * Virtual-hosted: https://{bucket}.{accountId}.r2.cloudflarestorage.com/{key}?...
     * Path-style:      https://{accountId}.r2.cloudflarestorage.com/{bucket}/{key}?...
     */
    public extractKeyFromUrl(url: string): string | null {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            const pathParts = urlObj.pathname.split('/').filter(Boolean);

            // Decode each path segment (URLs have percent-encoded chars like %20 for spaces)
            const decodedParts = pathParts.map(p => decodeURIComponent(p));

            // Detect virtual-hosted style: hostname starts with bucket name
            if (hostname.startsWith(this.bucketName + '.')) {
                // Virtual-hosted: key is the full decoded path
                return decodedParts.join('/');
            }

            // Path-style: first segment is bucket, rest is key
            if (decodedParts.length >= 2) {
                return decodedParts.slice(1).join('/');
            }

            return null;
        } catch {
            return null;
        }
    }

    private getMimeType(ext: string): string {
        const mimeTypes: Record<string, string> = {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            webp: 'image/webp',
            pdf: 'application/pdf',
            svg: 'image/svg+xml',
            bmp: 'image/bmp',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * Extracts the original filename from a signed R2 URL.
     * URL format: .../{folder}/{timestamp}-{originalName}?...
     */
    extractFileNameFromUrl(url: string): string | null {
        try {
            const key = this.extractKeyFromUrl(url);
            if (!key) return null;
            const parts = key.split('/');
            const fileNamePart = parts[parts.length - 1];
            // Remove timestamp prefix (e.g., "1743212345678-")
            const match = fileNamePart.match(/^\d+-(.+)$/);
            return match ? decodeURIComponent(match[1]) : decodeURIComponent(fileNamePart);
        } catch {
            return null;
        }
    }
}
