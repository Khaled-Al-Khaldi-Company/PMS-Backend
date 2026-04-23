import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PurchasesModule } from './purchases/purchases.module';
import { QuotationsModule } from './quotations/quotations.module';
import { ProjectsModule } from './projects/projects.module';
import { BoqModule } from './boq/boq.module';
import { ContractsModule } from './contracts/contracts.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DaftraModule } from './daftra/daftra.module';
import { MaterialsModule } from './materials/materials.module';
import { SettingsModule } from './settings/settings.module';
import { ContactsModule } from './contacts/contacts.module';
import { ReportsModule } from './reports/reports.module';
import { ExpensesModule } from './expenses/expenses.module';
import { InventoryModule } from './inventory/inventory.module';
import { QuotationTemplatesModule } from './quotation-templates/quotation-templates.module';

@Module({
  imports: [
    PrismaModule, 
    UsersModule, 
    AuthModule, 
    ProjectsModule, 
    BoqModule, 
    ContractsModule, 
    InvoicesModule, 
    DaftraModule, 
    PurchasesModule, 
    QuotationsModule,
    MaterialsModule,
    SettingsModule,
    ContactsModule,
    ReportsModule,
    ExpensesModule,
    InventoryModule,
    QuotationTemplatesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
