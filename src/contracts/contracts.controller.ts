import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('v1/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(@Body() createContractDto: any) {
    const { projectId, subcontractorId, subcontractorName, items, ...rest } = createContractDto;
    
    // Auto-create subcontractor if name is provided
    const subcontractorConn = subcontractorId 
      ? { connect: { id: subcontractorId } } 
      : subcontractorName 
        ? { create: { name: subcontractorName } }
        : undefined;

    return this.contractsService.create({
      ...rest,
      project: { connect: { id: projectId } },
      subcontractor: subcontractorConn,
      items: items && items.length > 0 ? {
        create: items.map((it: any) => ({
          boqItemId: it.boqItemId,
          assignedQty: Number(it.assignedQty),
          unitPrice: Number(it.unitPrice),
          totalValue: Number(it.assignedQty) * Number(it.unitPrice)
        }))
      } : undefined
    });
  }

  @Get('project/:projectId')
  findAllByProject(@Param('projectId') projectId: string) {
    return this.contractsService.findAllByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.contractsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractsService.remove(id);
  }

  // --- Change Orders (ملاحق العقود) ---
  @Post(':id/change-orders')
  createChangeOrder(@Param('id') contractId: string, @Body() changeOrderDto: any) {
    return this.contractsService.createChangeOrder(contractId, changeOrderDto);
  }
}
