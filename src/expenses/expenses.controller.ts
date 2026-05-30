import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
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
  create(@Body() createData: any, @Req() req: any) {
    createData.requestedBy = req.user.name;
    createData.requestedById = req.user.userId;
    return this.expensesService.create(createData);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.expensesService.findAll(req.user);
  }

  @Delete(':id')
  @Permissions('EXPENSE_APPROVE')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
