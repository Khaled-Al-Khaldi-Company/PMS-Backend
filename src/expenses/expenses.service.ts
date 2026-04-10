import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const count = await this.prisma.expense.count() + 1;
    const expenseNo = `EXP-${new Date().getFullYear()}-${count.toString().padStart(3, '0')}`;
    
    // Convert amount to number safely
    const amount = Number(data.amount) || 0;
    
    const { projectId, ...rest } = data;
    const projectConn = projectId ? { project: { connect: { id: projectId } } } : {};

    return this.prisma.expense.create({
      data: {
        ...rest,
        expenseNo,
        amount,
        ...projectConn
      },
      include: { project: true }
    });
  }

  async findAll() {
    return this.prisma.expense.findMany({
      include: { project: true },
      orderBy: { date: 'desc' }
    });
  }

  async remove(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }
}

