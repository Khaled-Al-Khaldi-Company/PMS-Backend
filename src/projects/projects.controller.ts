import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: any, @Request() req: any) {
    const { clientName, clientId, ...rest } = createProjectDto;

    const clientConn = clientId 
      ? { connect: { id: clientId } } 
      : clientName 
        ? { create: { name: clientName } }
        : undefined;

    return this.projectsService.create({
      ...rest,
      client: clientConn,
      manager: { connect: { id: req.user.userId } }
    });
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('dashboard/global')
  getGlobalDashboard() {
    return this.projectsService.getGlobalDashboard();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/budget-report')
  getBudgetReport(@Param('id') id: string) {
    return this.projectsService.getBudgetReport(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: any) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
