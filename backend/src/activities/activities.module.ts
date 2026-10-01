import { Module } from '@nestjs/common';
import { ActivitiesApplication } from './activities.application';
import { ActivitiesController } from './activities.controller';

@Module({ controllers: [ActivitiesController], providers: [ActivitiesApplication] })
export class ActivitiesModule {}
