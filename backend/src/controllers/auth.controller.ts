import type { Request, Response } from 'express';
import { authService, emailService } from '../services';
import { User, type IUser } from '../models';
import { env } from '../config';
import { ServiceUnavailableError, successResponse, ValidationError } from '../utils';

const accessCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const refreshCookieOptions = { ...accessCookieOptions, path: '/api/v1/auth' };

const readRefreshCookie = (req: Request): string | undefined => {
  const cookie = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('refresh_token='));
  if (!cookie) return undefined;
  try {
    return decodeURIComponent(cookie.slice('refresh_token='.length));
  } catch {
    return undefined;
  }
};

const issueCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }): void => {
  res.cookie('access_token', tokens.accessToken, { ...accessCookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', tokens.refreshToken, {
    ...refreshCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearCookies = (res: Response): void => {
  res.clearCookie('access_token', accessCookieOptions);
  res.clearCookie('refresh_token', refreshCookieOptions);
};

const publicUser = (user: IUser) => ({
  userId: user._id.toString(),
  tenantId: user.tenantId,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  title: user.title,
  department: user.department,
  team: user.team,
  isVerified: user.isVerified,
  settings: user.settings,
  role: user.role,
  permissions: user.permissions,
});

export const authController = {
  register: async (_req: Request, _res: Response): Promise<void> => {
    await authService.register();
  },

  login: async (req: Request, res: Response): Promise<void> => {
    const { user, tokens } = await authService.login(req.body, req.ip);
    issueCookies(res, tokens);
    successResponse(res, 'Login successful', { user: publicUser(user) });
  },

  logout: async (req: Request, res: Response): Promise<void> => {
    const refreshToken = readRefreshCookie(req) ?? (req.body.refreshToken as string | undefined);
    if (refreshToken) await authService.logout(req.user!.userId, refreshToken);
    clearCookies(res);
    successResponse(res, 'Logout successful');
  },

  refresh: async (req: Request, res: Response): Promise<void> => {
    const refreshToken = readRefreshCookie(req) ?? (req.body.refreshToken as string | undefined);
    if (!refreshToken) {
      clearCookies(res);
      res.status(401).json({ success: false, message: 'Refresh token is required', error: { code: 'UNAUTHORIZED' } });
      return;
    }
    const tokens = await authService.refreshToken(refreshToken);
    issueCookies(res, tokens);
    successResponse(res, 'Token refreshed', { refreshed: true });
  },

  forgotPassword: async (req: Request, res: Response): Promise<void> => {
    const token = await authService.requestPasswordReset(req.body.email as string);
    if (token) {
      await emailService.sendMail(
        req.body.email as string,
        'Reset your password',
        `<p>Reset token: ${token}</p>`,
      );
    }
    successResponse(res, 'If account exists, reset instructions have been sent');
  },

  resetPassword: async (req: Request, res: Response): Promise<void> => {
    await authService.resetPassword(req.body.token as string, req.body.password as string);
    successResponse(res, 'Password reset successful');
  },

  me: async (req: Request, res: Response): Promise<void> => {
    const user = await User.findById(req.user!.userId);
    if (!user || !user.isActive) {
      clearCookies(res);
      res.status(401).json({ success: false, message: 'Session is no longer active', error: { code: 'UNAUTHORIZED' } });
      return;
    }
    successResponse(res, 'Current user', publicUser(user));
  },

  updateMe: async (req: Request, res: Response): Promise<void> => {
    const user = await User.findById(req.user!.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Session is no longer active', error: { code: 'UNAUTHORIZED' } });
      return;
    }
    const body = req.body as Record<string, unknown>;
    let changed = false;
    const profileFields = ['firstName', 'lastName', 'phone', 'title', 'department', 'team'] as const;
    for (const field of profileFields) {
      const value = body[field];
      if (value === undefined) continue;
      if (typeof value !== 'string' || value.trim().length > (field === 'firstName' || field === 'lastName' ? 80 : 160)) {
        throw new ValidationError(`${field} must be a valid string under the maximum length`);
      }
      if ((field === 'firstName' || field === 'lastName') && value.trim().length === 0) {
        throw new ValidationError(`${field} cannot be empty`);
      }
      user[field] = value.trim();
      changed = true;
    }
    if (body.email !== undefined || body.role !== undefined || body.permissions !== undefined || body.password !== undefined) {
      throw new ValidationError('Email, role, permissions, and password cannot be changed through profile settings');
    }
    if (body.settings !== undefined) {
      const settings = body.settings as Record<string, unknown>;
      if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new ValidationError('settings must be an object');
      if (settings.notifications !== undefined) {
        const notifications = settings.notifications as Record<string, unknown>;
        const allowed = ['email', 'sms', 'push', 'leadAssignment', 'dailyDigest'] as const;
        if (!notifications || typeof notifications !== 'object' || Array.isArray(notifications) || Object.keys(notifications).some((key) => !allowed.includes(key as typeof allowed[number])) || Object.values(notifications).some((value) => typeof value !== 'boolean')) {
          throw new ValidationError('Notification settings contain unsupported values');
        }
        user.settings.notifications = { ...user.settings.notifications, ...notifications };
        changed = true;
      }
      if (settings.preferences !== undefined) {
        const preferences = settings.preferences as Record<string, unknown>;
        const allowed = ['language', 'timezone', 'dateFormat', 'theme'] as const;
        if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences) || Object.keys(preferences).some((key) => !allowed.includes(key as typeof allowed[number]))) {
          throw new ValidationError('Preference settings contain unsupported fields');
        }
        if (preferences.language !== undefined && !['en', 'ar'].includes(String(preferences.language))) throw new ValidationError('Unsupported language');
        if (preferences.theme !== undefined && !['light', 'dark'].includes(String(preferences.theme))) throw new ValidationError('Unsupported theme');
        if (preferences.timezone !== undefined && (typeof preferences.timezone !== 'string' || preferences.timezone.length > 80)) throw new ValidationError('Timezone is invalid');
        if (preferences.dateFormat !== undefined && (typeof preferences.dateFormat !== 'string' || preferences.dateFormat.length > 32)) throw new ValidationError('Date format is invalid');
        user.settings.preferences = { ...user.settings.preferences, ...preferences };
        changed = true;
      }
      if (Object.keys(settings).some((key) => key !== 'notifications' && key !== 'preferences')) throw new ValidationError('Unsupported settings section');
    }
    if (!changed) throw new ValidationError('No supported profile settings were supplied');
    await user.save();
    successResponse(res, 'Profile settings saved', publicUser(user));
  },

  changePassword: async (req: Request, res: Response): Promise<void> => {
    await authService.changePassword(
      req.user!.userId,
      req.body.currentPassword as string,
      req.body.newPassword as string,
    );
    successResponse(res, 'Password changed successfully');
  },

  verifyEmail: async (_req: Request, _res: Response): Promise<void> => {
    throw new ServiceUnavailableError('Email verification cannot be completed until the account verification provider is configured');
  },
};
