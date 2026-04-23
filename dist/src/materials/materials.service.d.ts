import { PrismaService } from '../prisma/prisma.service';
export declare class MaterialsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        type: string;
        code: string;
        unit: string;
        defaultPrice: number | null;
    }[]>;
    create(data: {
        name: string;
        code: string;
        unit: string;
        type?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        type: string;
        code: string;
        unit: string;
        defaultPrice: number | null;
    }>;
}
