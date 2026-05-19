import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { Tenant } from './entities/tenant.entity';
import { TenantVersion } from './entities/tenant-version.entity';

@Controller('api/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async findAll(): Promise<Tenant[]> {
    return this.tenantService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Tenant> {
    return this.tenantService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<Tenant> {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantService.remove(id);
  }

  @Get(':id/versions')
  async getVersions(@Param('id') id: string): Promise<TenantVersion[]> {
    return this.tenantService.getVersions(id);
  }

  @Post(':id/versions/:version/rollback')
  async rollback(
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number,
  ): Promise<Tenant> {
    return this.tenantService.rollback(id, version);
  }
}
