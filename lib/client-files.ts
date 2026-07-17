import { toast } from 'sonner';
import {
    getAcceptAttribute,
    getCategoryErrorMessage,
    partitionFilesByCategory,
    type FileCategory,
} from '@/lib/file-validation';

export function getValidFilesOrNotify(files: File[] | FileList, category: FileCategory): File[] {
    const { valid, rejected } = partitionFilesByCategory(files, category);

    if (rejected.length > 0) {
        const preview = rejected
            .map((file) => file.name)
            .slice(0, 3)
            .join(', ');
        const suffix = rejected.length > 3 ? ` (+${rejected.length - 3} autre(s))` : '';

        toast.error('Fichier(s) ignoré(s)', {
            description: `"${preview}"${suffix}. ${getCategoryErrorMessage(category)}`,
        });
    }

    return valid;
}

export { getAcceptAttribute, type FileCategory };
