import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('v1/purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Permissions('PO_CREATE')
  create(@Body() createPurchaseDto: any) {
    return this.purchasesService.create(createPurchaseDto);
  }

  @Get()
  findAll() {
    return this.purchasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }

  @Patch(':id/sync-daftra')
  @Permissions('PO_APPROVE')
  syncStatusFromDaftra(@Param('id') id: string) {
    return this.purchasesService.syncStatusFromDaftra(id);
  }

  @Patch(':id/approve')
  @Permissions('PO_APPROVE')
  approveStatus(@Param('id') id: string) {
    return this.purchasesService.approveStatus(id);
  }

  @Delete(':id')
  @Permissions('PO_CREATE')
  remove(@Param('id') id: string) {
    return this.purchasesService.remove(id);
  }
}
