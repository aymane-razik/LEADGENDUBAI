import { Router } from 'express';
import { authController } from '../controllers';
import { asyncHandler, authenticate, authRateLimiter, validate } from '../middleware';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);
router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);
router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout),
);
router.post(
  '/refresh',
  authRateLimiter,
  asyncHandler(authController.refresh),
);
router.post(
  '/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPassword),
);
router.post(
  '/reset-password',
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPassword),
);
router.get('/me', authenticate, asyncHandler(authController.me));
router.put('/me', authenticate, asyncHandler(authController.updateMe));
router.put(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
);
router.post('/verify-email', authenticate, asyncHandler(authController.verifyEmail));

export default router;
