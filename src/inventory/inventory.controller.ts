import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('warehouses')
  createWarehouse(@Body() data: any) {
    return this.inventoryService.createWarehouse(data);
  }

  @Get('warehouses')
  getWarehouses() {
    return this.inventoryService.findAllWarehouses();
  }

  @Get('warehouses/:id/stock')
  getWarehouseStock(@Param('id') id: string) {
    return this.inventoryService.getWarehouseStock(id);
  }

  @Post('transactions/receipt')
  recordReceipt(@Body() data: any) {
    return this.inventoryService.recordReceipt(data);
  }

  @Post('transactions/issue')
  recordIssue(@Body() data: any) {
    return this.inventoryService.recordIssue(data);
  }

  @Get('transactions')
  getTransactions(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getTransactions(warehouseId);
  }
}
