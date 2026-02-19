import { PrismaClient } from "@prisma/client";
import { StartTreinoRequest, StartTreinoData } from "./types/startTreino.types";

const prisma = new PrismaClient();

export class StartTreinoUseCase {
  async execute({ userId, nomeTreino }: StartTreinoRequest): Promise<StartTreinoData> {
    // 1️⃣ Verificar sessão ativa
    const activeSession = await prisma.sESSAO_TREINO.findFirst({
      where: {
        USER_ID: userId,
        FINALIZADO_EM: null,
      },
    });

    if (activeSession) {
      throw new Error("Você já possui uma sessão de treino ativa.");
    }

    const treino = await prisma.tREINO.findFirst({
      where: {
        USER_ID: userId,
        NOME: {
          equals: nomeTreino,
          mode: "insensitive",
        },
      },
      include: {
        EXERCICIOS: {
          orderBy: {
            ORDEM: "asc",
          },
          include: {
            EXERCICIO: true,
          },
        },
      },
    });

    if (!treino) {
      throw new Error("Treino não encontrado.");
    }

    if (treino.EXERCICIOS.length === 0) {
      throw new Error("Este treino não possui exercícios.");
    }

    const session = await prisma.sESSAO_TREINO.create({
      data: {
        USER_ID: userId,
        TREINO_ID: treino.ID,
      },
    });

    const primeiro = treino.EXERCICIOS[0];

    return {
      sessionId: session.ID,
      treinoNome: treino.NOME,
      primeiroExercicio: {
        id: primeiro.EXERCICIO.ID,
        nome: primeiro.EXERCICIO.NOME,
      },
    };
  }
}
