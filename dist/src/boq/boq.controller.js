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
exports.BoqController = void 0;
const common_1 = require("@nestjs/common");
const boq_service_1 = require("./boq.service");
const passport_1 = require("@nestjs/passport");
let BoqController = class BoqController {
    boqService;
    constructor(boqService) {
        this.boqService = boqService;
    }
    createSingleItem(projectId, createDto) {
        createDto.totalValue = createDto.quantity * createDto.unitPrice;
        return this.boqService.createItem(projectId, createDto);
    }
    createBatch(projectId, items) {
        return this.boqService.createBatch(projectId, items);
    }
    findAllByProject(projectId) {
        return this.boqService.findByProject(projectId);
    }
    updateItem(id, updateDto) {
        if (updateDto.quantity || updateDto.unitPrice) {
        }
        return this.boqService.updateItem(id, updateDto);
    }
    deleteItem(id) {
        return this.boqService.deleteItem(id);
    }
};
exports.BoqController = BoqController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoqController.prototype, "createSingleItem", null);
__decorate([
    (0, common_1.Post)('batch-import'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)('items')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", void 0)
], BoqController.prototype, "createBatch", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BoqController.prototype, "findAllByProject", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BoqController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BoqController.prototype, "deleteItem", null);
exports.BoqController = BoqController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('v1/projects/:projectId/boq'),
    __metadata("design:paramtypes", [boq_service_1.BoqService])
], BoqController);
//# sourceMappingURL=boq.controller.js.map