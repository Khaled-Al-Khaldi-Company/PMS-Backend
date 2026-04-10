import { Controller, Post, Get, Param, UseGuards, Body } from '@nestjs/common';
import { DaftraService } from './daftra.service';
import { AuthGuard } from '@nestjs/passport';
@Controller('v1/integration/daftra')
export class DaftraController {
  constructor(private readonly daftraService: DaftraService) {}

  @Get('test-po')
  testPo() {
    return this.daftraService.testPo();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('sync/cost-centers')
  syncCostCenters() {
    return this.daftraService.syncCostCenters();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('push-invoice/:invoiceId')
  pushInvoice(@Param('invoiceId') invoiceId: string) {
    return this.daftraService.pushInvoice(invoiceId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('clients')
  getClients() {
    return this.daftraService.getDaftraClients();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('suppliers')
  getSuppliers() {
    return this.daftraService.getDaftraSuppliers();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('pms-suppliers')
  getPmsSuppliers() {
    return this.daftraService.getPmsSuppliers();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('link-supplier/:id')
  linkSupplier(@Param('id') id: string, @Body('daftraId') daftraId: string) {
    return this.daftraService.linkSupplier(id, daftraId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('pms-clients')
  getPmsClients() {
    return this.daftraService.getPmsClients();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('link-client/:id')
  linkClient(@Param('id') id: string, @Body('daftraId') daftraId: string) {
    return this.daftraService.linkClient(id, daftraId);
  }

  // ── Cost Centers ─────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'))
  @Get('cost-centers')
  getCostCenters() {
    return this.daftraService.getDaftraCostCenters();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('pms-projects')
  getPmsProjects() {
    return this.daftraService.getPmsProjects();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('link-project/:id')
  linkProject(@Param('id') id: string, @Body('daftraCostCenterId') daftraCostCenterId: string) {
    return this.daftraService.linkProject(id, daftraCostCenterId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-cost-center/:projectId')
  createAndLinkCostCenter(@Param('projectId') projectId: string) {
    return this.daftraService.createAndLinkCostCenter(projectId);
  }
}
