import { Module } from '@nestjs/common';
import { QuotationTemplatesService } from './quotation-templates.service';
import { QuotationTemplatesController } from './quotation-templates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuotationTemplatesController],
  providers: [QuotationTemplatesService],
  exports: [QuotationTemplatesService],
})
export class QuotationTemplatesModule {}
