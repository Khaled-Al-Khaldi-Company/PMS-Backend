import { Controller, Post, Body, Param, Get, Patch, Put, Delete, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('v1/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Delete(':id')
  deleteMustaqlasa(@Param('id') id: string) {
    return this.invoicesService.deleteMustaqlasa(id);
  }

  @Post(':contractId/generate')
  generateMustaqlasa(@Param('contractId') contractId: string, @Body() payload: any) {
    return this.invoicesService.generateMustaqlasa(contractId, payload);
  }

  @Put(':id')
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
  certifyInvoice(@Param('id') id: string) {
    return this.invoicesService.certifyInvoice(id);
  }

  @Post(':id/sync-payment')
  syncPaymentStatus(@Param('id') id: string) {
    return this.invoicesService.syncPaymentStatus(id);
  }
}
