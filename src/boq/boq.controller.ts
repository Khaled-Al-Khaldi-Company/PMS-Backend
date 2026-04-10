import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BoqService } from './boq.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('v1/projects/:projectId/boq')
export class BoqController {
  constructor(private readonly boqService: BoqService) {}

  @Post()
  createSingleItem(@Param('projectId') projectId: string, @Body() createDto: any) {
    // Calculate totalValue automatically based on qty * price
    createDto.totalValue = createDto.quantity * createDto.unitPrice;
    return this.boqService.createItem(projectId, createDto);
  }

  @Post('batch-import')
  createBatch(@Param('projectId') projectId: string, @Body('items') items: any[]) {
    // Usually consumes JSON parsed from Excel in the frontend
    return this.boqService.createBatch(projectId, items);
  }

  @Get()
  findAllByProject(@Param('projectId') projectId: string) {
    return this.boqService.findByProject(projectId);
  }

  @Patch(':id')
  updateItem(@Param('id') id: string, @Body() updateDto: any) {
    if (updateDto.quantity || updateDto.unitPrice) {
      // Re-calculate totalValue if components changed
      // This is a naive implementation; ideally you fetch the item or ensure valid DTOs
    }
    return this.boqService.updateItem(id, updateDto);
  }

  @Delete(':id')
  deleteItem(@Param('id') id: string) {
    return this.boqService.deleteItem(id);
  }
}
