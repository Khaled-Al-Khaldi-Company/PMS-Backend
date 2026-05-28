import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  targetRevenue?: number;

  @IsNumber()
  @IsOptional()
  estimatedBudget?: number;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  daftraCustomerId?: string;

  @IsString()
  @IsOptional()
  daftraCostCenterId?: string;
}
