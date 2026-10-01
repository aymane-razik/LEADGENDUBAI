import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { TenantContextInterceptor } from '../tenants/tenant-context.interceptor';
import { LeadsApplication } from './leads.application';

@Controller('api/v2/leads')
@UseGuards(AccessTokenGuard)
@UseInterceptors(TenantContextInterceptor)
export class LeadsController {
  constructor(private readonly leads: LeadsApplication) {}

  @Post()
  create(@Body() payload: unknown, @Req() request: Request) {
    return this.leads.create(payload, {
      tenantId: request.user?.tenantId ?? 'default',
      actorId: request.user?.userId,
    });
  }

  @Get()
  list(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('status') status?: string,
  ) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('page must be positive and limit must be between 1 and 100');
    }
    return this.leads.list({ page, limit, status });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Lead id must be a valid identifier');
    return this.leads.getById(id);
  }

  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body('status') status: string, @Req() request: Request) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Lead id must be a valid identifier');
    if (typeof status !== 'string') throw new BadRequestException('status is required');
    return this.leads.changeStatus(id, status, {
      tenantId: request.user?.tenantId ?? 'default',
      actorId: request.user?.userId,
    });
  }
}

