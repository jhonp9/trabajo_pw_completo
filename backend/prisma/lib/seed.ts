
import bcrypt from 'bcrypt';
import { PrismaClient } from '../../src/generated/prisma';
const prisma = new PrismaClient();

const main = async () => {
  await prisma.user.createMany({
    data: [
      {
        email: "admin2@admin.com",
        name: "admin",
        password: await bcrypt.hash("admin", 10),
        role: "ADMIN"
      }
    ]
  });
    await prisma.game.createMany({
        data: [
        
        ]
    });
    await prisma.news.createMany({
        data: [
            
        ]
    });
  // Datos iniciales de juegos, noticias, etc.
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });