import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { TenantContextInterceptor } from '../tenants/tenant-context.interceptor';
import { ActivitiesApplication } from './activities.application';

@Controller('api/v2/activities')
@UseGuards(AccessTokenGuard)
@UseInterceptors(TenantContextInterceptor)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesApplication) {}

  @Get('upcoming')
  upcoming() { return this.activities.upcoming(); }

  @Get('overdue')
  overdue() { return this.activities.overdue(); }

  @Get()
  list(@Query('page', new ParseIntPipe({ optional: true })) page = 1, @Query('limit', new ParseIntPipe({ optional: true })) limit = 20) {
    if (page < 1 || limit < 1 || limit > 100) throw new BadRequestException('page must be positive and limit must be between 1 and 100');
    return this.activities.list(page, limit);
  }

  @Post()
  create(@Body() input: unknown, @Req() request: Request) {
    return this.activities.create(input, request.user?.userId);
  }

  @Get(':id')
  getById(@Param('id') id: string) { return this.activities.getById(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() input: unknown) { return this.activities.update(id, input); }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() input: unknown) { return this.activities.update(id, input); }

  @Patch(':id/complete')
  complete(@Param('id') id: string) { return this.activities.complete(id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.activities.remove(id); }
}
