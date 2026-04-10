"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DaftraModule = void 0;
const common_1 = require("@nestjs/common");
const daftra_service_1 = require("./daftra.service");
const daftra_controller_1 = require("./daftra.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const settings_module_1 = require("../settings/settings.module");
let DaftraModule = class DaftraModule {
};
exports.DaftraModule = DaftraModule;
exports.DaftraModule = DaftraModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, settings_module_1.SettingsModule],
        controllers: [daftra_controller_1.DaftraController],
        providers: [daftra_service_1.DaftraService],
        exports: [daftra_service_1.DaftraService]
    })
], DaftraModule);
//# sourceMappingURL=daftra.module.js.map