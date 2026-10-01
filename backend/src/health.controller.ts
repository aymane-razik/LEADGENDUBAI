import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { redisClient } from './config';
import mongoose from 'mongoose';

@Controller('api/v2/health')
export class HealthController {
  @Get('live')
  live(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  ready(@Res({ passthrough: true }) response: Response): { status: string; dependencies: { mongo: string; redis: string } } {
    const mongo = mongoose.connection.readyState === 1;
    const redis = redisClient.status === 'ready';
    if (!mongo || !redis) response.status(503);
    return {
      status: mongo && redis ? 'ok' : 'degraded',
      dependencies: { mongo: mongo ? 'ready' : 'unavailable', redis: redis ? 'ready' : 'unavailable' },
    };
  }
}
