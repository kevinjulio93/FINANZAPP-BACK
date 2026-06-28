export interface FileEntry {
    pagoId: string;
    name: string;
    url: string;
    amount: number;
    date: string;
    categoryName: string;
    year: number;
    serviceName: string;
    month: number;
}

export interface MonthNode {
    month: number;
    files: FileEntry[];
}

export interface ServiceNode {
    name: string;
    months: MonthNode[];
}

export interface YearNode {
    year: number;
    services: ServiceNode[];
}

export interface CategoryNode {
    name: string;
    years: YearNode[];
}

export interface FileTree {
    categories: CategoryNode[];
}

export interface IFileRepository {
    getFilesByUserId(userId: string): Promise<FileEntry[]>;
}
