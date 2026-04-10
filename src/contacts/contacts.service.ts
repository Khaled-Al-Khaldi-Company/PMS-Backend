import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  // -------------------------
  // SUPPLIERS
  // -------------------------
  
  async getSuppliers() {
    return this.prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createSupplier(data: any) {
    return this.prisma.supplier.create({ data });
  }

  async updateSupplier(id: string, data: any) {
    return this.prisma.supplier.update({
      where: { id },
      data
    });
  }

  async deleteSupplier(id: string) {
    return this.prisma.supplier.delete({
      where: { id }
    });
  }

  // -------------------------
  // CLIENTS
  // -------------------------

  async getClients() {
    return this.prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createClient(data: any) {
    return this.prisma.client.create({ data });
  }

  async updateClient(id: string, data: any) {
    return this.prisma.client.update({
      where: { id },
      data
    });
  }

  async deleteClient(id: string) {
    return this.prisma.client.delete({
      where: { id }
    });
  }
}
