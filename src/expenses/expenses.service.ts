import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const count = (await this.prisma.expense.count()) + 1;
    const expenseNo = `EXP-${new Date().getFullYear()}-${count.toString().padStart(3, '0')}`;

    // Convert amount to number safely
    const amount = Number(data.amount) || 0;

    const { projectId, requestedBy, requestedById, ...rest } = data;
    const projectConn = projectId
      ? { project: { connect: { id: projectId } } }
      : {};

    return this.prisma.expense.create({
      data: {
        ...rest,
        expenseNo,
        amount,
        requestedBy,
        requestedById,
        ...projectConn,
      },
      include: { project: true },
    });
  }

  async findAll(user?: any) {
    const canViewAll = user?.permissions?.includes('VIEW_ALL_RECORDS') || user?.role === 'Admin' || user?.role === 'System Admin';
    const where: any = {};
    if (!canViewAll && user?.userId) {
      where.OR = [
        { requestedById: user.userId },
        { project: { managerId: user.userId } },
      ];
    }
    return this.prisma.expense.findMany({
      where,
      include: { project: true },
      orderBy: { date: 'desc' },
    });
  }

  async remove(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }
}
