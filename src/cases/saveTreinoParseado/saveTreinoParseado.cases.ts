import { prisma } from "../../lib/prisma";
import { CreateTreinosFromParsedJsonInput } from "./types/saveTreinoParseado.types";

export class CreateTreinosFromParsedJsonUseCase {
  async execute({ userId, treinos }: CreateTreinosFromParsedJsonInput) {
    return prisma.$transaction(async (tx) => {
      const createdTreinos = [];

      for (const treino of treinos) {
        const createdTreino = await tx.tREINO.create({
          data: {
            USER_ID: userId,
            NOME: treino.nome,
          },
        });

        for (const exercicio of treino.exercicios) {
          let existingExercicio = await tx.eXERCICIO.findFirst({
            where: {
              NOME: exercicio.nome,
            },
          });

          if (!existingExercicio) {
            existingExercicio = await tx.eXERCICIO.create({
              data: {
                NOME: exercicio.nome,
              },
            });
          }

          await tx.tREINO_EXERCICIO.create({
            data: {
              TREINO_ID: createdTreino.ID,
              EXERCICIO_ID: existingExercicio.ID,
              ORDEM: exercicio.ordem,
            },
          });
        }

        createdTreinos.push(createdTreino);
      }

      return createdTreinos;
    }, { timeout: 15000 });
  }
}
