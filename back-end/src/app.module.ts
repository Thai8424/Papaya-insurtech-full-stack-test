import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantModule } from './modules/web-admin/tenant/tenant.module';
import { ClaimModule } from './modules/web-admin/claim/claim.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3' as any,
      database: 'db.sqlite',
      autoLoadEntities: true,
      synchronize: true, // Auto-create tables for local testing
    }),
    TenantModule,
    ClaimModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

