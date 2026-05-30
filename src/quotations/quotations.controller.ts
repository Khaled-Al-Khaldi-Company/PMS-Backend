import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('v1/quotations')
export class QuotationsController {
  private readonly logger = new Logger(QuotationsController.name);
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @Permissions('QUOTATION_CREATE')
  async create(@Body() createQuotationDto: any, @Req() req: any) {
    try {
      createQuotationDto.createdBy = req.user?.name;
      createQuotationDto.createdById = req.user?.userId;
      return await this.quotationsService.create(createQuotationDto);
    } catch (err: any) {
      this.logger.error(`Create quotation failed: ${err.message}`, err.stack);
      throw err;
    }
  }

  @Get()
  findAll(@Req() req: any) {
    return this.quotationsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('QUOTATION_CREATE', 'QUOTATION_APPROVE', 'QUOTATION_FORCE_EDIT')
  update(
    @Param('id') id: string,
    @Body() updateQuotationDto: any,
    @Req() req: any,
  ) {
    return this.quotationsService.update(id, updateQuotationDto, req.user);
  }

  @Patch(':id/revert-to-draft')
  @Permissions('QUOTATION_CREATE', 'QUOTATION_APPROVE')
  revertToDraft(@Param('id') id: string) {
    return this.quotationsService.revertToDraft(id);
  }

  @Post(':id/convert')
  @Permissions('QUOTATION_APPROVE')
  convertToProject(@Param('id') id: string, @Req() req: any) {
    return this.quotationsService.convertToProject(id, req.user.name);
  }

  @Post(':id/unlink')
  @Permissions('QUOTATION_FORCE_DELETE')
  unlink(@Param('id') id: string) {
    return this.quotationsService.unlink(id);
  }

  @Delete(':id')
  @Permissions(
    'QUOTATION_CREATE',
    'QUOTATION_APPROVE',
    'QUOTATION_FORCE_DELETE',
  )
  remove(@Param('id') id: string, @Req() req: any) {
    return this.quotationsService.remove(id, req.user);
  }
}
