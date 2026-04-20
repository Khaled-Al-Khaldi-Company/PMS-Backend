import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('v1/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  findAll() {
    return this.materialsService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.materialsService.create(data);
  }
}
