import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ContractItemDto {
  @IsString()
  @IsNotEmpty()
  boqItemId: string;

  @IsNumber()
  assignedQty: number;

  @IsNumber()
  unitPrice: number;
}

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  subcontractorId?: string;

  @IsString()
  @IsOptional()
  subcontractorName?: string;

  @IsString()
  @IsNotEmpty()
  referenceNumber: string;

  @IsNumber()
  totalValue: number;

  @IsNumber()
  @IsOptional()
  retentionPercent?: number;

  @IsNumber()
  @IsOptional()
  advancePayment?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractItemDto)
  @IsOptional()
  items?: ContractItemDto[];
}
