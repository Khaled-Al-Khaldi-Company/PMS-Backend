import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
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

  async updateRolePermissions(roleId: string, permissionNames: string[]) {
    // Reconnect permissions by name
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: { set: [] } // first disconnect all
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

  async createUser(data: any) {
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

  async updateUser(id: string, data: any) {
    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.email !== undefined) updateData.email = data.email;
    
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
}
