import prisma from '../lib/prisma';
import { News } from '../types';

export const getAllNews = async (): Promise<News[]> => {
  return prisma.news.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const getNewsById = async (id: string): Promise<News | null> => {
  return prisma.news.findUnique({
    where: { id }
  });
};

export const createNews = async (newsData: Omit<News, 'id' | 'createdAt'>, author: string): Promise<News> => {
  return prisma.news.create({
    data: {
      ...newsData,
      author,
      date: new Date().toISOString()
    }
  });
};

export const updateNews = async (id: string, newsData: Partial<News>): Promise<News> => {
  return prisma.news.update({
    where: { id },
    data: newsData
  });
};

export const deleteNews = async (id: string): Promise<void> => {
  await prisma.news.delete({
    where: { id }
  });
};