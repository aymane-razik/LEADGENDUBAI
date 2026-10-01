import { Module } from '@nestjs/common';
import { PropertiesApplication } from './properties.application';
import { PropertiesController } from './properties.controller';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesApplication],
})
export class PropertiesModule {}
