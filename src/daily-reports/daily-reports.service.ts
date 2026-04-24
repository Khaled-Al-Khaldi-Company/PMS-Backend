import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyReportsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, data: any) {
    const { reportDate, weather, temperature, workPerformed, safetyNotes, labors, equipments, createdBy } = data;
    
    return this.prisma.dailyReport.create({
      data: {
        projectId,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
        weather,
        temperature: temperature ? parseFloat(temperature) : null,
        workPerformed,
        safetyNotes,
        createdBy,
        labors: {
          create: labors?.map((l: any) => ({
            trade: l.trade,
            count: parseInt(l.count),
            hours: parseFloat(l.hours),
            notes: l.notes
          })) || []
        },
        equipments: {
          create: equipments?.map((e: any) => ({
            equipmentType: e.equipmentType,
            count: parseInt(e.count),
            hours: parseFloat(e.hours),
            notes: e.notes
          })) || []
        }
      },
      include: { labors: true, equipments: true }
    });
  }

  async findAllByProject(projectId: string) {
    return this.prisma.dailyReport.findMany({
      where: { projectId },
      include: { labors: true, equipments: true },
      orderBy: { reportDate: 'desc' }
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.dailyReport.findUnique({
      where: { id },
      include: { 
        labors: true, 
        equipments: true,
        project: { select: { name: true, code: true } }
      }
    });
    if (!report) throw new NotFoundException('Daily report not found');
    return report;
  }

  async delete(id: string) {
    return this.prisma.dailyReport.delete({
      where: { id }
    });
  }
}
