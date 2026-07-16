import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const prismaMock = {
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    appController = app.get<AppController>(AppController);
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return the running message', () => {
      expect(appController.getHello()).toBe('Behdoon API is running');
    });
  });

  describe('getUsers', () => {
    it('never selects the password column', async () => {
      let capturedArgs: { select: Record<string, boolean> } | undefined;
      prismaMock.user.findMany.mockImplementation(
        (args: { select: Record<string, boolean> }) => {
          capturedArgs = args;
          return Promise.resolve([]);
        },
      );

      await appController.getUsers();

      expect(capturedArgs?.select).toEqual({
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      });
    });
  });
});
