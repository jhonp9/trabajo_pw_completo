import prisma from '../lib/prisma';
import { Game, Review } from '../types';
import { Prisma } from '@prisma/client';

export const getGames = async (): Promise<Game[]> => {
  return prisma.game.findMany({
    include: { reviews: true }
  });
};

export const getGameById = async (id: number): Promise<Game | null> => {
  return prisma.game.findUnique({
    where: { id },
    include: { reviews: true }
  });
};

export const createGame = async (gameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<Game> => {
  return prisma.game.create({
    data: {
      ...gameData,
      sales: 0,
      rating: 0
    }
  });
};

export const updateGame = async (id: number, gameData: Partial<Game>): Promise<Game> => {
  return prisma.game.update({
    where: { id },
    data: gameData
  });
};

export const deleteGame = async (id: number): Promise<void> => {
  await prisma.game.delete({
    where: { id }
  });
};

export const addGameReview = async (gameId: number, review: Omit<Review, 'id' | 'gameId'>, userId: number): Promise<Review> => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newReview = await tx.review.create({
      data: {
        ...review,
        gameId,
        userId,
        date: new Date().toISOString()
      }
    });

    const reviews = await tx.review.findMany({ where: { gameId } });
    const avgRating = reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length;

    await tx.game.update({
      where: { id: gameId },
      data: { rating: parseFloat(avgRating.toFixed(1)) }
    });

    return newReview;
  });
};