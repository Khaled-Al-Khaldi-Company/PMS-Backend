import { MaterialsService } from './materials.service';
export declare class MaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
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
    create(data: any): Promise<{
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
