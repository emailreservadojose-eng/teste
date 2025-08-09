// backend/tests/auth.test.js
import request from 'supertest';
import app, { db } from '../src/index.js';

describe('Auth API', () => {
  const uname = 'tester_' + Math.floor(Math.random() * 100000);
  const pwd = 'secret123';

  afterAll(async () => {
    await db.destroy();
  });

  test('register -> login -> refresh -> logout', async () => {
    const reg = await request(app).post('/auth/register').send({ username: uname, password: pwd });
    expect(reg.statusCode).toBe(201);

    const login = await request(app).post('/auth/login').send({ username: uname, password: pwd });
    expect(login.statusCode).toBe(200);
    expect(login.body.accessToken).toBeDefined();
    expect(login.body.refreshToken).toBeDefined();

    const refresh = await request(app).post('/auth/refresh').send({ refreshToken: login.body.refreshToken });
    expect(refresh.statusCode).toBe(200);
    expect(refresh.body.accessToken).toBeDefined();
    expect(refresh.body.refreshToken).toBeDefined();
    expect(refresh.body.refreshToken).not.toBe(login.body.refreshToken);

    const logout = await request(app).post('/auth/logout').send({ refreshToken: refresh.body.refreshToken });
    expect(logout.statusCode).toBe(200);
  });
});
