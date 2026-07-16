import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  const createContext = (role?: UserRole): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext(UserRole.CUSTOMER))).toBe(true);
  });

  it('allows access when the user has a required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(createContext(UserRole.ADMIN))).toBe(true);
  });

  it('denies access when the user lacks a required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(createContext(UserRole.CUSTOMER))).toBe(false);
  });

  it('denies access when there is no authenticated user', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    expect(guard.canActivate(createContext(undefined))).toBe(false);
  });
});
