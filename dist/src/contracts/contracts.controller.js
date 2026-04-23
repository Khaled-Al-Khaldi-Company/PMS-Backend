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
exports.ContractsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_service_1 = require("./contracts.service");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../auth/permissions.guard");
const permissions_decorator_1 = require("../auth/permissions.decorator");
let ContractsController = class ContractsController {
    contractsService;
    constructor(contractsService) {
        this.contractsService = contractsService;
    }
    create(createContractDto, req) {
        const { projectId, subcontractorId, subcontractorName, items, ...rest } = createContractDto;
        rest.createdBy = req.user.name;
        const subcontractorConn = subcontractorId
            ? { connect: { id: subcontractorId } }
            : subcontractorName
                ? { create: { name: subcontractorName } }
                : undefined;
        return this.contractsService.create({
            ...rest,
            project: { connect: { id: projectId } },
            subcontractor: subcontractorConn,
            items: items && items.length > 0 ? {
                create: items.map((it) => ({
                    boqItemId: it.boqItemId,
                    assignedQty: Number(it.assignedQty),
                    unitPrice: Number(it.unitPrice),
                    totalValue: Number(it.assignedQty) * Number(it.unitPrice)
                }))
            } : undefined
        });
    }
    findAllByProject(projectId) {
        return this.contractsService.findAllByProject(projectId);
    }
    findOne(id) {
        return this.contractsService.findOne(id);
    }
    update(id, updateDto) {
        return this.contractsService.update(id, updateDto);
    }
    remove(id) {
        return this.contractsService.remove(id);
    }
    createChangeOrder(contractId, changeOrderDto, req) {
        changeOrderDto.createdBy = req.user.name;
        return this.contractsService.createChangeOrder(contractId, changeOrderDto);
    }
};
exports.ContractsController = ContractsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('CONTRACT_CREATE'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('project/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "findAllByProject", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('CONTRACT_CREATE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('CONTRACT_APPROVE'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/change-orders'),
    (0, permissions_decorator_1.Permissions)('CONTRACT_CREATE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "createChangeOrder", null);
exports.ContractsController = ContractsController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('v1/contracts'),
    __metadata("design:paramtypes", [contracts_service_1.ContractsService])
], ContractsController);
//# sourceMappingURL=contracts.controller.js.map