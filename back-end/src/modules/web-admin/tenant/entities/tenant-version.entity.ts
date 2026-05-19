import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { TenantConfig } from '../interfaces/tenant-config.interface';

@Entity('tenant_versions')
export class TenantVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @Column()
  version: number;

  @Column('simple-json')
  config: TenantConfig;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
