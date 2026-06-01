import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getViewableProjects } from '../common/permissions-helper';

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
    const viewableProjects = getViewableProjects(user);
    const where: any = {};
    if (viewableProjects !== null && user?.userId) {
      const filters: any[] = [
        { requestedById: user.userId },
        { project: { managerId: user.userId } },
      ];
      if (viewableProjects.length > 0) {
        filters.push({ projectId: { in: viewableProjects } });
      }
      where.OR = filters;
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
