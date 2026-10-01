import request from 'supertest';
import app from '../../src/app';

describe('Auth API', () => {
  it('returns validation error for invalid register payload', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({ email: 'invalid' });
    expect(response.status).toBe(400);
    const body = response.body as { success: boolean };
    expect(body.success).toBe(false);
  });

  it('returns validation error for login payload without password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'john@example.com' });
    expect(response.status).toBe(400);
  });

  it('health endpoint is public', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/api/v1/unknown-route');
    expect(response.status).toBe(404);
  });
});
