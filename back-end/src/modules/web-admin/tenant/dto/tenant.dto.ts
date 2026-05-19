import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, IsNumber } from 'class-validator';
import { TenantBranding, ClaimTypeConfig, ApprovalTier, NotificationRule, SlaConfig, CustomField } from '../interfaces/tenant-config.interface';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @IsObject()
  @IsOptional()
  claimTypes?: ClaimTypeConfig;

  @IsObject()
  @IsOptional()
  approvalRules?: {
    autoApprovalThreshold: number;
    tiers: ApprovalTier[];
  };

  @IsArray()
  @IsOptional()
  notifications?: NotificationRule[];

  @IsObject()
  @IsOptional()
  sla?: SlaConfig;

  @IsArray()
  @IsOptional()
  customFields?: CustomField[];
}

export class UpdateTenantDto extends CreateTenantDto {}
