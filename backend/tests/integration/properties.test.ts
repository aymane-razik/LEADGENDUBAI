import request from 'supertest';
import app from '../../src/app';

describe('Properties API', () => {
  it('requires authentication for list endpoint', async () => {
    const response = await request(app).get('/api/v1/properties');
    expect(response.status).toBe(401);
  });

  it('responds with health endpoint', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    const body = response.body as { success: boolean };
    expect(body.success).toBe(true);
  });

  it('health detailed returns service status', async () => {
    const response = await request(app).get('/api/v1/health/detailed');
    expect(response.status).toBe(200);
    const body = response.body as { success: boolean; data?: { services?: { mongo?: string; redis?: string } } };
    expect(body.success).toBe(true);
    expect(body.data?.services).toBeDefined();
  });
});
