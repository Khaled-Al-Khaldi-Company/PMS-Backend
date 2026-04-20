import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.material.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async create(data: { name: string; code: string; unit: string; type?: string }) {
    return this.prisma.material.create({ data });
  }
}
