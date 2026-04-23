"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaftraController = void 0;
const common_1 = require("@nestjs/common");
const daftra_service_1 = require("./daftra.service");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../auth/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let DaftraController = class DaftraController {
    daftraService;
    constructor(daftraService) {
        this.daftraService = daftraService;
    }
    testPo() {
        return this.daftraService.testPo();
    }
    syncCostCenters() {
        return this.daftraService.syncCostCenters();
    }
    pushInvoice(invoiceId) {
        return this.daftraService.pushInvoice(invoiceId);
    }
    getClients() {
        return this.daftraService.getDaftraClients();
    }
    getSuppliers() {
        return this.daftraService.getDaftraSuppliers();
    }
    getPmsSuppliers() {
        return this.daftraService.getPmsSuppliers();
    }
    linkSupplier(id, daftraId) {
        return this.daftraService.linkSupplier(id, daftraId);
    }
    getPmsClients() {
        return this.daftraService.getPmsClients();
    }
    linkClient(id, daftraId) {
        return this.daftraService.linkClient(id, daftraId);
    }
    getCostCenters() {
        return this.daftraService.getDaftraCostCenters();
    }
    getPmsProjects() {
        return this.daftraService.getPmsProjects();
    }
    linkProject(id, daftraCostCenterId) {
        return this.daftraService.linkProject(id, daftraCostCenterId);
    }
    createAndLinkCostCenter(projectId) {
        return this.daftraService.createAndLinkCostCenter(projectId);
    }
};
exports.DaftraController = DaftraController;
__decorate([
    (0, common_1.Get)('test-po'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "testPo", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('sync/cost-centers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "syncCostCenters", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    (0, common_1.Post)('push-invoice/:invoiceId'),
    (0, permissions_decorator_1.Permissions)('INVOICE_APPROVE'),
    __param(0, (0, common_1.Param)('invoiceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "pushInvoice", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('clients'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "getClients", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('suppliers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "getSuppliers", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('pms-suppliers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "getPmsSuppliers", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('link-supplier/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('daftraId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "linkSupplier", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('pms-clients'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "getPmsClients", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('link-client/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('daftraId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "linkClient", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('cost-centers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "getCostCenters", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('pms-projects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "getPmsProjects", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('link-project/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('daftraCostCenterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "linkProject", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('create-cost-center/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DaftraController.prototype, "createAndLinkCostCenter", null);
exports.DaftraController = DaftraController = __decorate([
    (0, common_1.Controller)('v1/integration/daftra'),
    __metadata("design:paramtypes", [daftra_service_1.DaftraService])
], DaftraController);
//# sourceMappingURL=daftra.controller.js.map