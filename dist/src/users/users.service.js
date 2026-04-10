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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
            include: { role: { include: { permissions: true } } },
        });
    }
    async create(data) {
        return this.prisma.user.create({
            data,
        });
    }
    async findAll() {
        return this.prisma.user.findMany({
            include: { role: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findAllRoles() {
        return this.prisma.role.findMany({
            include: { permissions: true },
            orderBy: { createdAt: 'asc' }
        });
    }
    async findAllPermissions() {
        return this.prisma.permission.findMany();
    }
    async updateRolePermissions(roleId, permissionNames) {
        return this.prisma.role.update({
            where: { id: roleId },
            data: {
                permissions: { set: [] }
            }
        }).then(() => {
            return this.prisma.role.update({
                where: { id: roleId },
                data: {
                    permissions: {
                        connect: permissionNames.map(name => ({ name }))
                    }
                },
                include: { permissions: true }
            });
        });
    }
    async createUser(data) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                isActive: data.isActive ?? true,
                role: { connect: { id: data.roleId } }
            },
            include: { role: true }
        });
    }
    async updateUser(id, data) {
        const updateData = {};
        if (data.firstName !== undefined)
            updateData.firstName = data.firstName;
        if (data.lastName !== undefined)
            updateData.lastName = data.lastName;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.roleId) {
            updateData.role = { connect: { id: data.roleId } };
        }
        if (data.password) {
            const bcrypt = require('bcrypt');
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }
        return this.prisma.user.update({
            where: { id },
            data: updateData,
            include: { role: true }
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map