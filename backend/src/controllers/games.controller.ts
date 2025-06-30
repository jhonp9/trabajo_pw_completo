import { Request, Response } from 'express';
import { gameSchema } from '../utils/validacion';
import { Prisma } from '@prisma/client';
import { Review } from '../types';
import { RequestHandler } from 'express';
import { PrismaClient } from '../generated/prisma';

export const getGamesList = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const games = await prisma.game.findMany({
      include: { reviews: true }
    });
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los juegos' });
  }
};

export const getGameDetails: RequestHandler = async (req, res, next) => {
  const prisma = new PrismaClient();
  try {
    const game = await prisma.game.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { reviews: true }
    });
    
    if (!game) {
      res.status(404).json({ message: 'Game not found' });
      return; // <-- Importante: return después de enviar la respuesta
    }
    
    res.json(game); // <-- Esto es suficiente, no necesitas return
  } catch (error) {
    next(error); // <-- Pasa el error al middleware de errores
  }
};

export const createGame = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const gameData = gameSchema.parse(req.body);
    const game = await prisma.game.create({
      data: {
        ...gameData,
        sales: 0,
        rating: 0
      }
    });
    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Error al crear el juego' 
    });
  }
};

export const updateGame = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const gameData = gameSchema.partial().parse(req.body);
    const game = await prisma.game.update({
      where: { id: parseInt(req.params.id) },
      data: gameData
    });
    res.json(game);
  } catch (error) {
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Error al actualizar el juego' 
    });
  }
};

export const deleteGame = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    await prisma.game.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el juego' });
  }
};

export const addGameReview = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { author, rating, comment } = req.body;
    const gameId = parseInt(req.params.gameId);
    const userId = req.user?.id;

    const review = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newReview = await tx.review.create({
        data: {
          author,
          rating,
          comment,
          date: new Date().toISOString(),
          gameId,
          userId
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

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar la reseña' });
  }
};

export const purchaseGame : RequestHandler = async (req, res, next) => {
  const prisma = new PrismaClient();
  try {
    const { quantity = 1 } = req.body;
    const gameId = parseInt(req.params.gameId);
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'No autorizado' });
      return 
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.game.update({
        where: { id: gameId },
        data: { sales: { increment: quantity } }
      });

      await tx.user.update({
        where: { id: userId },
        data: { purchasedGames: { connect: { id: gameId } } }
      });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error al procesar la compra' });
  }
};