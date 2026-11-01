import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { configCon } from '../../../test-utils/config';

describe('JwtStrategy', () => {
  const s = new JwtStrategy(configCon({ JWT_SECRET: 'secreto' }));

  it('el dueño actúa sobre su propia cuenta', async () => {
    expect(await s.validate({ type: 'access', sub: 'dueno', role: 'owner' })).toMatchObject({
      userId: 'dueno', cuentaId: 'dueno', esStaff: false, role: 'owner',
    });
  });

  it('el empleado actúa sobre el club de su dueño, pero se sabe quién es', async () => {
    expect(await s.validate({ type: 'access', sub: 'empleado', role: 'owner', staff: true, ownerId: 'dueno' })).toMatchObject({
      userId: 'dueno', cuentaId: 'empleado', esStaff: true,
    });
  });

  it('el refresh token no sirve como access token', async () => {
    await expect(s.validate({ type: 'refresh', sub: 'x' })).rejects.toThrow(UnauthorizedException);
  });
});
