import { comparePasswords } from '../utils/auth';
import prisma from '../lib/prisma';
import { User } from '../types';

export const getAllUsers = async (): Promise<User[]> => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });
};

export const getUserById = async (id: number): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  return prisma.user.update({
    where: { id },
    data: userData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });
};

export const deleteUser = async (id: number): Promise<void> => {
  await prisma.user.delete({
    where: { id }
  });
};

export const validateUser = async (email: string, password: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  
  const isValid = await comparePasswords(password, user.password);
  return isValid ? user : null;
};