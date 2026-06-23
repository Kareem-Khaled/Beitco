import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            checkReadiness: jest
              .fn()
              .mockResolvedValue({ ready: true, checks: { database: 'up', redis: 'up' } }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return liveness status', () => {
    const result = controller.check();
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('ok');
    expect(result.data.timestamp).toBeDefined();
    expect(result.data.uptime).toBeDefined();
  });

  it('should report readiness with dependency checks', async () => {
    const res = { status: jest.fn() } as unknown as import('express').Response;
    const result = await controller.ready(res);
    expect(result.ready).toBe(true);
    expect(result.checks).toEqual({ database: 'up', redis: 'up' });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
