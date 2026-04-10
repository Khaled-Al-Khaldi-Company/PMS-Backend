import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('v1/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // Suppliers endpoints
  @Get('suppliers')
  getSuppliers() {
    return this.contactsService.getSuppliers();
  }

  @Post('suppliers')
  createSupplier(@Body() data: any) {
    return this.contactsService.createSupplier(data);
  }

  @Put('suppliers/:id')
  updateSupplier(@Param('id') id: string, @Body() data: any) {
    return this.contactsService.updateSupplier(id, data);
  }

  @Delete('suppliers/:id')
  deleteSupplier(@Param('id') id: string) {
    return this.contactsService.deleteSupplier(id);
  }

  // Clients endpoints
  @Get('clients')
  getClients() {
    return this.contactsService.getClients();
  }

  @Post('clients')
  createClient(@Body() data: any) {
    return this.contactsService.createClient(data);
  }

  @Put('clients/:id')
  updateClient(@Param('id') id: string, @Body() data: any) {
    return this.contactsService.updateClient(id, data);
  }

  @Delete('clients/:id')
  deleteClient(@Param('id') id: string) {
    return this.contactsService.deleteClient(id);
  }
}
