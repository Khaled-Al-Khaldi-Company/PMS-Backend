import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, BOQItem } from '@prisma/client';

@Injectable()
export class BoqService {
  constructor(private prisma: PrismaService) {}

  async createItem(projectId: string, data: Prisma.BOQItemCreateInput): Promise<BOQItem> {
    return this.prisma.bOQItem.create({
      data: {
        ...data,
        project: { connect: { id: projectId } }
      }
    });
  }

  async createBatch(projectId: string, items: any[]): Promise<any> {
    // Prisma createMany is great for Excel imports
    const itemsData = items.map(item => ({
      ...item,
      projectId,
      totalValue: item.quantity * item.unitPrice
    }));
    
    return this.prisma.bOQItem.createMany({
      data: itemsData,
    });
  }

  async findByProject(projectId: string): Promise<BOQItem[]> {
    return this.prisma.bOQItem.findMany({
      where: { projectId },
      include: { contractItems: true, invoiceDetails: true },
      orderBy: { itemCode: 'asc' }
    });
  }

  async updateItem(id: string, data: Prisma.BOQItemUpdateInput): Promise<BOQItem> {
    return this.prisma.bOQItem.update({
      where: { id },
      data,
    });
  }

  async deleteItem(id: string): Promise<BOQItem> {
    return this.prisma.bOQItem.delete({ where: { id } });
  }
}
