import prisma from '../lib/prisma';
import { hashPassword, comparePasswords } from '../utils/auth';
import { User } from '../types';

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { email } });
};

export const createUser = async (userData: {
  email: string;
  name: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}): Promise<User> => {
  const hashedPassword = await hashPassword(userData.password);
  return prisma.user.create({
    data: {
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      role: userData.role || 'USER'
    }
  });
};

export const validateUser = async (email: string, password: string): Promise<User | null> => {
  const user = await findUserByEmail(email);
  if (!user || !user.password) return null;
  
  const isValid = await comparePasswords(password, user.password);
  return isValid ? user : null;
};