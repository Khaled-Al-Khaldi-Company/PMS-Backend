"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const purchases_module_1 = require("./purchases/purchases.module");
const quotations_module_1 = require("./quotations/quotations.module");
const projects_module_1 = require("./projects/projects.module");
const boq_module_1 = require("./boq/boq.module");
const contracts_module_1 = require("./contracts/contracts.module");
const invoices_module_1 = require("./invoices/invoices.module");
const daftra_module_1 = require("./daftra/daftra.module");
const materials_module_1 = require("./materials/materials.module");
const settings_module_1 = require("./settings/settings.module");
const contacts_module_1 = require("./contacts/contacts.module");
const reports_module_1 = require("./reports/reports.module");
const expenses_module_1 = require("./expenses/expenses.module");
const inventory_module_1 = require("./inventory/inventory.module");
const quotation_templates_module_1 = require("./quotation-templates/quotation-templates.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            projects_module_1.ProjectsModule,
            boq_module_1.BoqModule,
            contracts_module_1.ContractsModule,
            invoices_module_1.InvoicesModule,
            daftra_module_1.DaftraModule,
            purchases_module_1.PurchasesModule,
            quotations_module_1.QuotationsModule,
            materials_module_1.MaterialsModule,
            settings_module_1.SettingsModule,
            contacts_module_1.ContactsModule,
            reports_module_1.ReportsModule,
            expenses_module_1.ExpensesModule,
            inventory_module_1.InventoryModule,
            quotation_templates_module_1.QuotationTemplatesModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map