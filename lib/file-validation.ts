export const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm'] as const;

export const IMAGE_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'ico', 'tga',
    'heic', 'heif', 'psd', 'svg', 'cr2', 'nef', 'dng', 'raw',
] as const;

export const MEDIA_EXTENSIONS = [...VIDEO_EXTENSIONS, ...IMAGE_EXTENSIONS] as const;

export type FileCategory = 'image' | 'video' | 'media' | 'pdf';

export const ACCEPT_IMAGES = 'image/*,.heic,.heif,.psd,.svg,.cr2,.nef,.dng,.raw';
export const ACCEPT_VIDEOS = 'video/*';
export const ACCEPT_MEDIA = `${ACCEPT_IMAGES},${ACCEPT_VIDEOS}`;
export const ACCEPT_PDF = '.pdf,application/pdf';

export function getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
}

function hasExtension(fileName: string, extensions: readonly string[]): boolean {
    const ext = getFileExtension(fileName);
    return extensions.includes(ext);
}

export function isImageFile(file: { name: string; type?: string }): boolean {
    if (file.type?.startsWith('image/')) return true;
    return hasExtension(file.name, IMAGE_EXTENSIONS);
}

export function isVideoFile(file: { name: string; type?: string }): boolean {
    if (file.type?.startsWith('video/')) return true;
    return hasExtension(file.name, VIDEO_EXTENSIONS);
}

export function isMediaFile(file: { name: string; type?: string }): boolean {
    return isImageFile(file) || isVideoFile(file);
}

export function isPdfFile(file: { name: string; type?: string }): boolean {
    if (file.type === 'application/pdf') return true;
    return getFileExtension(file.name) === 'pdf';
}

export function matchesCategory(file: { name: string; type?: string }, category: FileCategory): boolean {
    switch (category) {
        case 'image':
            return isImageFile(file);
        case 'video':
            return isVideoFile(file);
        case 'media':
            return isMediaFile(file);
        case 'pdf':
            return isPdfFile(file);
    }
}

export function filterFilesByCategory(files: File[] | FileList, category: FileCategory): File[] {
    return Array.from(files).filter((file) => matchesCategory(file, category));
}

export function partitionFilesByCategory(
    files: File[] | FileList,
    category: FileCategory
): { valid: File[]; rejected: File[] } {
    const all = Array.from(files);
    const valid = filterFilesByCategory(all, category);
    const validSet = new Set(valid);
    return {
        valid,
        rejected: all.filter((file) => !validSet.has(file)),
    };
}

export function getAcceptAttribute(category: FileCategory): string {
    switch (category) {
        case 'image':
            return ACCEPT_IMAGES;
        case 'video':
            return ACCEPT_VIDEOS;
        case 'media':
            return ACCEPT_MEDIA;
        case 'pdf':
            return ACCEPT_PDF;
    }
}

export function getCategoryErrorMessage(category: FileCategory): string {
    switch (category) {
        case 'image':
            return 'Seules les images sont acceptées (JPG, PNG, WebP, GIF, HEIC…).';
        case 'video':
            return 'Seules les vidéos sont acceptées (MP4, MOV, AVI, MKV, WebM).';
        case 'media':
            return 'Seuls les fichiers image ou vidéo sont acceptés.';
        case 'pdf':
            return 'Seuls les fichiers PDF sont acceptés.';
    }
}

export function getAllowedExtensions(category: FileCategory): readonly string[] {
    switch (category) {
        case 'image':
            return IMAGE_EXTENSIONS;
        case 'video':
            return VIDEO_EXTENSIONS;
        case 'media':
            return MEDIA_EXTENSIONS;
        case 'pdf':
            return ['pdf'];
    }
}
