import { NextFunction, Request, Response } from 'express';
import { generateToken, comparePasswords, hashPassword } from '../utils/auth';
import { loginSchema, registerSchema } from '../utils/validacion';
import * as userService from '../services/user.service';
import { RequestHandler } from 'express';
import { PrismaClient } from '../generated/prisma';
import { generateVerificationCode, sendVerificationEmail } from '../services/email.service';

const prisma = new PrismaClient();

interface VerifyEmailBody {
  code: string;
}

// Tipo para el cuerpo de la solicitud de reenvío
interface ResendVerificationBody {
  email: string;
}

export const login : RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await userService.validateUser(email, password);
    if (!user) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return 
    }

    const token = generateToken(user.id, user.role);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400000
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Error en el login' 
    });
  }
};

export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  res.json({ exists: !!user });
};

export const register = async (req: Request, res: Response) => {
  try {
    // Validar los datos de entrada
    const { email, name, password } = registerSchema.parse(req.body);
    
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Este email ya está registrado' 
      });
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario con estado "no verificado"
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'USER',
        verified: false
      }
    });

    // Generar y guardar código de verificación
    const verificationCode = generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        code: verificationCode,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      }
    });

    // Enviar email con el código
    await sendVerificationEmail(email, verificationCode);

    res.json({ 
      success: true,
      message: 'Código de verificación enviado a tu email' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en el registro. Por favor intenta nuevamente.' 
    });
  }
};

export const verifyEmail = async (
  req: Request<{}, {}, VerifyEmailBody>, 
  res: Response
) => {
  try {
    const { code } = req.body;
    
    const verification = await prisma.verificationCode.findFirst({
      where: { code },
      include: { user: true }
    });

    if (!verification || new Date(verification.expiresAt) < new Date()) {
      res.status(400).json({ verified: false, message: 'Código inválido o expirado' });
      return;
    }

    await prisma.user.update({
      where: { id: verification.userId },
      data: { verified: true }
    });

    await prisma.verificationCode.delete({ where: { id: verification.id } });

    res.status(200).json({ verified: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar el email' });
  }
};

export const resendVerification = async (
  req: Request<{}, {}, ResendVerificationBody>, 
  res: Response
) => {
  try {
    const { email } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Eliminar códigos anteriores
    await prisma.verificationCode.deleteMany({ where: { userId: user.id } });

    // Generar nuevo código (debes implementar esta función)
    const verificationCode = generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        code: verificationCode,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    // Enviar email (debes implementar esta función)
    await sendVerificationEmail(email, verificationCode);

    res.json({ success: true });
  } catch (error) {
    console.error('Error resending verification:', error);
    res.status(500).json({ error: 'Error al reenviar el código de verificación' });
  }
};

// Las funciones generateVerificationCode y sendVerificationEmail se importan desde '../services/email.service'

export const getCurrentUser : RequestHandler = async (req, res, next) => {
  if (!req.user){
    res.status(401).json({ message: 'No autorizado' });
    return;
  } 
  
  
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role
  });
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Sesión cerrada correctamente' });
};