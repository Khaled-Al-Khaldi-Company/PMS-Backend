import { Controller, Get, Post, Body, Patch, Param, UseGuards, Delete, Req } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('v1/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Permissions('CONTRACT_CREATE')
  create(@Body() createContractDto: any, @Req() req: any) {
    const { projectId, subcontractorId, subcontractorName, items, ...rest } = createContractDto;
    rest.createdBy = req.user.name;
    
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
  @Permissions('CONTRACT_CREATE')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.contractsService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('CONTRACT_APPROVE')
  remove(@Param('id') id: string) {
    return this.contractsService.remove(id);
  }

  // --- Change Orders (ملاحق العقود) ---
  @Post(':id/change-orders')
  @Permissions('CONTRACT_CREATE')
  createChangeOrder(@Param('id') contractId: string, @Body() changeOrderDto: any, @Req() req: any) {
    changeOrderDto.createdBy = req.user.name;
    return this.contractsService.createChangeOrder(contractId, changeOrderDto);
  }
}
