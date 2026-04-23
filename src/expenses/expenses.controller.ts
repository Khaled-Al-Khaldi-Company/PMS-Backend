import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('v1/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Permissions('EXPENSE_CREATE')
  create(@Body() createData: any) {
    return this.expensesService.create(createData);
  }

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Delete(':id')
  @Permissions('EXPENSE_APPROVE')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}

