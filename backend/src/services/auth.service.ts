import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { User, type IUser } from '../models';
import { env } from '../config';
import { comparePassword, generateToken, hashPassword } from '../utils';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils';
import type { AuthTokens } from '../types';

interface LoginInput {
  email: string;
  password: string;
}

const buildPayload = (user: IUser) => ({
  userId: user._id.toString(),
  tenantId: user.tenantId ?? 'default',
  role: user.role,
  permissions: user.permissions,
});

const issueTokens = (user: IUser): AuthTokens => {
  const payload = buildPayload(user);
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE as jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRE as jwt.SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
};

const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const authService = {
  async register(): Promise<never> {
    // Account creation must happen through an authenticated organization invite.
    // The legacy public endpoint allowed callers to choose privileged roles.
    throw new ForbiddenError('Self-service registration is disabled; request an organization invitation');
  },

  async login(input: LoginInput, ip?: string): Promise<{ user: IUser; tokens: AuthTokens }> {
    const user = await User.findOne({ email: input.email.toLowerCase(), isActive: true });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const valid = await comparePassword(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const tokens = issueTokens(user);
    user.lastLogin = new Date();
    if (ip) {
      user.lastLoginIP = ip;
    }
    user.refreshTokens = [hashRefreshToken(tokens.refreshToken)];
    await user.save();

    return { user, tokens };
  },

  async logout(userId: string, refreshToken: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    user.refreshTokens = user.refreshTokens.filter((token) => token !== hashRefreshToken(refreshToken));
    await user.save();
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    let payload: { userId: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await User.findById(payload.userId);
    const storedTokenHash = hashRefreshToken(refreshToken);
    if (!user || !user.refreshTokens.includes(storedTokenHash)) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    user.refreshTokens = user.refreshTokens.filter((token) => token !== storedTokenHash);
    const tokens = issueTokens(user);
    user.refreshTokens.push(hashRefreshToken(tokens.refreshToken));
    await user.save();
    return tokens;
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) throw new UnauthorizedError('Current password is incorrect');

    user.password = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.refreshTokens = [];
    await user.save();
  },

  async requestPasswordReset(email: string): Promise<string> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return '';
    }
    const rawToken = generateToken(24);
    const resetToken = jwt.sign(
      { userId: user._id.toString(), token: rawToken },
      env.JWT_RESET_SECRET,
      {
        expiresIn: env.JWT_RESET_EXPIRE as jwt.SignOptions['expiresIn'],
      },
    );
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    return resetToken;
  },

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    let payload: { userId: string; token: string };
    try {
      payload = jwt.verify(resetToken, env.JWT_RESET_SECRET) as { userId: string; token: string };
    } catch {
      throw new UnauthorizedError('Invalid reset token');
    }

    const user = await User.findOne({
      _id: payload.userId,
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) throw new UnauthorizedError('Invalid or expired reset token');

    user.password = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.resetPasswordToken = '';
    user.resetPasswordExpires = new Date(0);
    user.refreshTokens = [];
    await user.save();
  },
};
