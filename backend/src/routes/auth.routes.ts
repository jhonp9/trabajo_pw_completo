import { Router } from 'express';
import { 
  login, 
  register, 
  getCurrentUser, 
  logout 
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;