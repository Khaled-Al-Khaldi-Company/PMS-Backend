import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotationTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.quotationTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.quotationTemplate.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.quotationTemplate.create({
      data: {
        name: data.name,
        technicalOffer: data.technicalOffer,
        termsConditions: data.termsConditions,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.quotationTemplate.update({
      where: { id },
      data: {
        name: data.name,
        technicalOffer: data.technicalOffer,
        termsConditions: data.termsConditions,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.quotationTemplate.delete({
      where: { id },
    });
  }
}
