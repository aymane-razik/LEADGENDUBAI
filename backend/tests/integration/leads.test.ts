import request from 'supertest';
import app from '../../src/app';

describe('Leads API', () => {
  it('requires authentication for list endpoint', async () => {
    const response = await request(app).get('/api/v1/leads');
    expect(response.status).toBe(401);
  });

  it('rejects invalid bearer credentials before validating the create payload', async () => {
    const response = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', 'Bearer invalid')
      .send({ firstName: 'a' });
    expect(response.status).toBe(401);
  });
});
