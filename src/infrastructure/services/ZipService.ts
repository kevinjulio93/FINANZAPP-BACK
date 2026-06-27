import AdmZip from 'adm-zip';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface ExtractedFile {
    originalName: string;
    buffer: Buffer;
    extension: string;
    size: number;
}

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf', '.webp'];

export class ZipService {
    extract(buffer: Buffer): ExtractedFile[] {
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        const files: ExtractedFile[] = [];

        for (const entry of entries) {
            if (entry.isDirectory) continue;

            const baseName = path.basename(entry.entryName);
            // Skip macOS metadata files (._ prefix)
            if (baseName.startsWith('._')) continue;
            // Skip hidden files
            if (baseName.startsWith('.')) continue;

            const ext = path.extname(entry.entryName).toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(ext)) continue;

            files.push({
                originalName: baseName,
                buffer: entry.getData(),
                extension: ext,
                size: entry.header.size,
            });
        }

        return files;
    }

    getTempDir(): string {
        return fs.mkdtempSync(path.join(os.tmpdir(), 'bulk-support-'));
    }

    cleanupTempDir(dir: string): void {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
        } catch {
            // ignore cleanup errors
        }
    }
}
