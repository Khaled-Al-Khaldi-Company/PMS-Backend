import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const { clientName, title, items, hasVat, technicalOffer, termsConditions } = data;
    
    const count = await this.prisma.quotation.count();
    const quotationNumber = `Q-2026-${(count + 1).toString().padStart(3, '0')}`;
    
    const totalAmount = items.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0);
    const vatAmount = hasVat ? totalAmount * 0.15 : 0;
    const netAmount = totalAmount + vatAmount;

    return this.prisma.quotation.create({
      data: {
        quotationNumber,
        title,
        technicalOffer,
        termsConditions,
        totalAmount,
        hasVat: hasVat || false,
        vatAmount,
        netAmount,
        client: {
          connectOrCreate: {
             where: { name: clientName },
             create: { name: clientName }
          }
        },
        items: {
          create: items.map((i: any) => ({
            itemCode: i.itemCode,
            description: i.description,
            unit: i.unit,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalValue: i.quantity * i.unitPrice,
            estimatedUnitCost: i.estimatedUnitCost || 0
          }))
        },
        createdBy: data.createdBy
      },
      include: {
        client: true,
        items: true
      }
    });
  }

  findAll() {
    return this.prisma.quotation.findMany({
      include: { client: true, project: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    return this.prisma.quotation.findUnique({
      where: { id },
      include: { client: true, items: true, project: true }
    });
  }

  async update(id: string, data: any, reqUser?: any) {
    const existing = await this.prisma.quotation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Quotation not found');
    
    if (existing.status === 'APPROVED') {
      const userPermissions = reqUser?.permissions || [];
      if (!userPermissions.includes('QUOTATION_FORCE_EDIT')) {
        throw new BadRequestException('لا يمكن تعديل عرض سعر معتمد.');
      }
    }

    const { clientName, title, items, hasVat, technicalOffer, termsConditions, status } = data;
    
    // Calculate new total
    const totalAmount = items.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0);
    const vatAmount = hasVat ? totalAmount * 0.15 : 0;
    const netAmount = totalAmount + vatAmount;

    // Completely replace items
    await this.prisma.quotationItem.deleteMany({
      where: { quotationId: id }
    });

    return this.prisma.quotation.update({
      where: { id },
      data: {
        title,
        status,
        technicalOffer,
        termsConditions,
        totalAmount,
        hasVat: hasVat || false,
        vatAmount,
        netAmount,
        client: {
          connectOrCreate: {
             where: { name: clientName },
             create: { name: clientName }
          }
        },
        items: {
          create: items.map((i: any) => ({
            itemCode: i.itemCode,
            description: i.description,
            unit: i.unit,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalValue: i.quantity * i.unitPrice,
            estimatedUnitCost: i.estimatedUnitCost || 0
          }))
        }
      },
      include: { client: true, items: true }
    });
  }

  async remove(id: string, reqUser?: any) {
    const quotation = await this.prisma.quotation.findUnique({ where: { id } });
    if (!quotation) throw new NotFoundException('Quotation not found');

    if (quotation.projectId || quotation.status === 'APPROVED') {
      const userPermissions = reqUser?.permissions || [];
      const canForce = userPermissions.includes('QUOTATION_FORCE_DELETE');

      // If it has a project ID, check if project still exists
      if (quotation.projectId) {
        const project = await this.prisma.project.findUnique({ where: { id: quotation.projectId } });
        if (!project) {
          // Project was deleted, clear the link and allow proceeding
          await this.prisma.quotation.update({
            where: { id },
            data: { projectId: null }
          });
          // Now it's no longer "converted to project"
        } else if (!canForce) {
          throw new BadRequestException('لا يمكن حذف عرض سعر مرتبط بمشروع قائم.');
        }
      } else if (quotation.status === 'APPROVED' && !canForce) {
        throw new BadRequestException('لا يمكن حذف عرض سعر معتمد.');
      }
    }

    await this.prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    return this.prisma.quotation.delete({ where: { id } });
  }

  async convertToProject(id: string, userName: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: { client: true, items: true }
    });

    if (!quotation) throw new NotFoundException('عرض السعر غير موجود');
    
    // Create new Project and BOQ from quotation items
    const projCount = await this.prisma.project.count();
    const projCode = `PRJ-${new Date().getFullYear()}-${(projCount + 1).toString().padStart(3, '0')}`;

    const project = await this.prisma.project.create({
      data: {
        name: quotation.title,
        code: projCode,
        client: { connect: { id: quotation.clientId } },
        quotation: { connect: { id: quotation.id } }, // Backlink
        status: 'ACTIVE',
        targetRevenue: quotation.netAmount,
        estimatedBudget: quotation.items.reduce((sum, item) => sum + (item.quantity * item.estimatedUnitCost), 0),
        boqItems: {
          create: quotation.items.map(i => ({
            itemCode: i.itemCode,
            description: i.description,
            unit: i.unit,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalValue: i.totalValue,
            estimatedUnitCost: i.estimatedUnitCost,
            estimatedTotalCost: i.quantity * i.estimatedUnitCost
          }))
        },
        contracts: {
          create: [
            {
              type: 'MAIN_CONTRACT',
              referenceNumber: `${projCode}-MAIN`,
              totalValue: quotation.totalAmount, // Base contract value without VAT
              retentionPercent: 10, // Default typical value, user can edit later
              advancePayment: 0,
            }
          ]
        }
      }
    });

    // Update quote status
    await this.prisma.quotation.update({
      where: { id },
      data: { 
        status: 'APPROVED', 
        projectId: project.id,
        approvedBy: userName,
        approvedAt: new Date()
      }
    });

    return project;
  }
  
  async unlink(id: string) {
    return this.prisma.quotation.update({
      where: { id },
      data: { 
        projectId: null,
        status: 'DRAFT'
      }
    });
  }
}
