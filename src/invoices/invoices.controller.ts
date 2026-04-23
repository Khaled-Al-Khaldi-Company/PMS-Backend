import { Controller, Post, Body, Param, Get, Patch, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('v1/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Delete(':id')
  @Permissions('INVOICE_CREATE')
  deleteMustaqlasa(@Param('id') id: string) {
    return this.invoicesService.deleteMustaqlasa(id);
  }

  @Post(':contractId/generate')
  @Permissions('INVOICE_CREATE')
  generateMustaqlasa(@Param('contractId') contractId: string, @Body() payload: any, @Req() req: any) {
    payload.createdBy = req.user.name;
    return this.invoicesService.generateMustaqlasa(contractId, payload);
  }

  @Put(':id')
  @Permissions('INVOICE_CREATE')
  updateMustaqlasa(@Param('id') id: string, @Body() payload: any) {
    return this.invoicesService.updateMustaqlasa(id, payload);
  }

  @Get('contract/:contractId')
  findAllByContract(@Param('contractId') contractId: string) {
    return this.invoicesService.findAllByContract(contractId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id/certify')
  @Permissions('INVOICE_REVIEW', 'INVOICE_APPROVE')
  certifyInvoice(@Param('id') id: string, @Req() req: any) {
    return this.invoicesService.certifyInvoice(id, req.user.name);
  }

  @Post(':id/sync-payment')
  @Permissions('INVOICE_APPROVE')
  syncPaymentStatus(@Param('id') id: string) {
    return this.invoicesService.syncPaymentStatus(id);
  }
}
