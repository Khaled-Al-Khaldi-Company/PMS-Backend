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
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const invoices_service_1 = require("./invoices.service");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../auth/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let InvoicesController = class InvoicesController {
    invoicesService;
    constructor(invoicesService) {
        this.invoicesService = invoicesService;
    }
    deleteMustaqlasa(id) {
        return this.invoicesService.deleteMustaqlasa(id);
    }
    generateMustaqlasa(contractId, payload, req) {
        payload.createdBy = req.user.name;
        return this.invoicesService.generateMustaqlasa(contractId, payload);
    }
    updateMustaqlasa(id, payload) {
        return this.invoicesService.updateMustaqlasa(id, payload);
    }
    findAllByContract(contractId) {
        return this.invoicesService.findAllByContract(contractId);
    }
    findOne(id) {
        return this.invoicesService.findOne(id);
    }
    certifyInvoice(id, req) {
        return this.invoicesService.certifyInvoice(id, req.user.name);
    }
    syncPaymentStatus(id) {
        return this.invoicesService.syncPaymentStatus(id);
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('INVOICE_CREATE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "deleteMustaqlasa", null);
__decorate([
    (0, common_1.Post)(':contractId/generate'),
    (0, permissions_decorator_1.Permissions)('INVOICE_CREATE'),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "generateMustaqlasa", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)('INVOICE_CREATE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "updateMustaqlasa", null);
__decorate([
    (0, common_1.Get)('contract/:contractId'),
    __param(0, (0, common_1.Param)('contractId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "findAllByContract", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/certify'),
    (0, permissions_decorator_1.Permissions)('INVOICE_REVIEW', 'INVOICE_APPROVE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "certifyInvoice", null);
__decorate([
    (0, common_1.Post)(':id/sync-payment'),
    (0, permissions_decorator_1.Permissions)('INVOICE_APPROVE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "syncPaymentStatus", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('v1/invoices'),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService])
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map