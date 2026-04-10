import { Module } from '@nestjs/common';
import { DaftraService } from './daftra.service';
import { DaftraController } from './daftra.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [DaftraController],
  providers: [DaftraService],
  exports: [DaftraService]
})
export class DaftraModule {}
