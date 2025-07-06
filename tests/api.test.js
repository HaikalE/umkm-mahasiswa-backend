const request = require('supertest');
const { app } = require('../src/server');

describe('API Health Check', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.message).toContain('UMKM Mahasiswa Backend API is running');
  });
});

describe('Authentication API', () => {
  test('POST /api/auth/register should validate required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({})
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  test('POST /api/auth/login should validate credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid@email.com',
        password: 'wrongpassword'
      })
      .expect(401);
    
    expect(response.body.success).toBe(false);
  });
});

describe('API Documentation', () => {
  test('GET /api/docs should return API documentation', async () => {
    const response = await request(app)
      .get('/api/docs')
      .expect(200);
    
    expect(response.body.message).toContain('API Documentation');
    expect(response.body.endpoints).toBeDefined();
  });
});

describe('CORS Configuration', () => {
  test('Should include CORS headers', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });
});

describe('Rate Limiting', () => {
  test('Should apply rate limiting headers', async () => {
    const response = await request(app)
      .get('/api/docs')
      .expect(200);
    
    // Rate limiting headers should be present
    expect(response.headers['x-ratelimit-limit'] || response.headers['x-ratelimit-remaining']).toBeDefined();
  });
});

describe('Error Handling', () => {
  test('Should handle 404 errors gracefully', async () => {
    const response = await request(app)
      .get('/api/nonexistent-endpoint')
      .expect(404);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('not found');
  });

  test('Should handle malformed JSON gracefully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }')
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });
});