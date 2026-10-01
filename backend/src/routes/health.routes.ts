import os from 'os';
import { Router } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config';
import { successResponse } from '../utils';

const router = Router();

router.get('/', (_req, res) => {
  successResponse(res, 'Service is healthy', {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/detailed', async (_req, res) => {
  const memory = process.memoryUsage();
  const redisStatus = redisClient.status;
  const dbStatus = mongoose.connection.readyState;
  const disk = {
    freeMb: Math.round(os.freemem() / 1024 / 1024),
    totalMb: Math.round(os.totalmem() / 1024 / 1024),
  };

  successResponse(res, 'Detailed health report', {
    services: {
      mongo: dbStatus === mongoose.STATES.connected ? 'up' : 'down',
      redis: redisStatus === 'ready' ? 'up' : 'degraded',
    },
    memory,
    disk,
    uptime: process.uptime(),
  });
});

export default router;
