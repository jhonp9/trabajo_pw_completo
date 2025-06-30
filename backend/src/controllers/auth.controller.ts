import { Request, Response } from 'express';
import { generateToken, comparePasswords, hashPassword } from '../utils/auth';
import { loginSchema, registerSchema } from '../utils/validacion';
import * as userService from '../services/user.service';
import { RequestHandler } from 'express';
import { PrismaClient } from '../generated/prisma';

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

export const register : RequestHandler = async (req, res, next) => {
  const prisma = new PrismaClient();
  try {
    const { email, name, password } = registerSchema.parse(req.body);
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'El usuario ya existe' });
      return 
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'USER'
      }
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Error en el registro' 
    });
  }
};

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