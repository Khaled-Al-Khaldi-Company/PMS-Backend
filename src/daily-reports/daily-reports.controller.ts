import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('v1/daily-reports')
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Post('project/:projectId')
  @RequirePermissions('PROJECT_EDIT')
  create(@Param('projectId') projectId: string, @Body() data: any) {
    return this.dailyReportsService.create(projectId, data);
  }

  @Get('project/:projectId')
  @RequirePermissions('PROJECT_VIEW')
  findAllByProject(@Param('projectId') projectId: string) {
    return this.dailyReportsService.findAllByProject(projectId);
  }

  @Get(':id')
  @RequirePermissions('PROJECT_VIEW')
  findOne(@Param('id') id: string) {
    return this.dailyReportsService.findOne(id);
  }

  @Delete(':id')
  @RequirePermissions('PROJECT_EDIT') // Ideally some force delete permission
  remove(@Param('id') id: string) {
    return this.dailyReportsService.delete(id);
  }
}
