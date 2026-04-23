import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('v1/quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @Permissions('QUOTATION_CREATE')
  create(@Body() createQuotationDto: any) {
    return this.quotationsService.create(createQuotationDto);
  }

  @Get()
  findAll() {
    return this.quotationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('QUOTATION_CREATE', 'QUOTATION_APPROVE')
  update(@Param('id') id: string, @Body() data: any) {
    return this.quotationsService.update(id, data);
  }

  @Post(':id/convert')
  @Permissions('QUOTATION_APPROVE')
  convertToProject(@Param('id') id: string) {
    return this.quotationsService.convertToProject(id);
  }

  @Delete(':id')
  @Permissions('QUOTATION_APPROVE')
  remove(@Param('id') id: string) {
    return this.quotationsService.remove(id);
  }
}
