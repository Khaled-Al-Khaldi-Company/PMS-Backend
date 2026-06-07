import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_dev_key',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findByEmail(payload.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or not found');
    }

    const projectPermissions =
      await this.usersService.getUserProjectPermissions(user.id);

    const screenPermissions = user.screenPermissions as string[] | undefined;

    return {
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role.name,
      permissions: user.role.permissions.map((p: any) => p.name),
      projectPermissions: projectPermissions.map((pp: any) => ({
        projectId: pp.projectId,
        permissions: pp.permissions as string[],
      })),
      screenPermissions: screenPermissions || [],
    };
  }
}
