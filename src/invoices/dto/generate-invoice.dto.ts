import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceDetailDto {
  @IsString()
  boqItemId: string;

  @IsNumber()
  currentQty: number;
}

export class GenerateInvoiceDto {
  @IsDateString()
  issueDate: string;

  @IsDateString()
  @IsOptional()
  periodStartDate?: string;

  @IsDateString()
  @IsOptional()
  periodEndDate?: string;

  @IsNumber()
  @IsOptional()
  taxPercent?: number;

  @IsNumber()
  @IsOptional()
  retentionPercent?: number;

  @IsNumber()
  @IsOptional()
  advanceDeduction?: number;

  @IsNumber()
  @IsOptional()
  delayPenalty?: number;

  @IsNumber()
  @IsOptional()
  otherDeductions?: number;

  @IsString()
  @IsOptional()
  deductionTiming?: string;

  @IsBoolean()
  @IsOptional()
  deferDeductions?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceDetailDto)
  details: InvoiceDetailDto[];
}
