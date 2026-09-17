import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import salesforceConfig from './salesforce.config.js';
import { SalesforceController } from './salesforce.controller.js';
import { SalesforceService } from './salesforce.service.js';

@Module({
  imports: [
    ConfigModule.forFeature(salesforceConfig),
  ],
  controllers: [SalesforceController],
  providers: [SalesforceService],
  exports: [SalesforceService], // Export so other modules can inject it if needed
})
export class SalesforceModule {}
