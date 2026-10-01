import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsApplication } from './leads.application';

@Module({
  controllers: [LeadsController],
  providers: [LeadsApplication],
})
export class LeadsModule {}
