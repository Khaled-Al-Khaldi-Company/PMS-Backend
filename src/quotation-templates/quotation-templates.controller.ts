import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { QuotationTemplatesService } from './quotation-templates.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('v1/quotation-templates')
export class QuotationTemplatesController {
  constructor(private readonly quotationTemplatesService: QuotationTemplatesService) {}

  @Get()
  findAll() {
    return this.quotationTemplatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationTemplatesService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.quotationTemplatesService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.quotationTemplatesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotationTemplatesService.remove(id);
  }
}
