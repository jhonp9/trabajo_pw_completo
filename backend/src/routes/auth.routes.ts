import { Router } from 'express';
import { 
  login, 
  register, 
  getCurrentUser, 
  logout,
  checkEmail, 
  verifyEmail,
  resendVerification 
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/check-email', checkEmail);
router.post('/register', register);
router.post('/verify', verifyEmail);
router.post('/resend-verification', resendVerification);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;