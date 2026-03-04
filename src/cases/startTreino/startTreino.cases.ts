import { prisma } from "../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import { StartTreinoRequest, StartTreinoData } from "./types/startTreino.types";

export class StartTreinoUseCase {
  async execute({ userId, treinoId }: StartTreinoRequest): Promise<StartTreinoData> {
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
        ID: treinoId,
        USER_ID: userId,
      },
      select: {
        ID: true,
        NOME: true,
      },
    });

    if (!treino) {
      throw new Error("Treino não encontrado para este usuário.");
    }

    const primeiroExercicio = await prisma.tREINO_EXERCICIO.findFirst({
      where: {
        TREINO_ID: treino.ID,
        ORDEM: 1,
      },
      include: {
        EXERCICIO: true,
      },
    });

    if (!primeiroExercicio) {
      throw new Error("Treino não possui exercícios.");
    }

    let sessao;
    try {
      sessao = await prisma.sESSAO_TREINO.create({
        data: {
          USER_ID: userId,
          TREINO_ID: treino.ID,
          INICIADO_EM: new Date(),
          EXERCICIO_ATUAL_ID: primeiroExercicio.EXERCICIO_ID,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("Você já possui uma sessão de treino ativa.");
      }

      throw error;
    }

    return {
      sessaoId: sessao.ID,
      treinoNome: treino.NOME,
      primeiroExercicio: {
        id: primeiroExercicio.EXERCICIO_ID,
        nome: primeiroExercicio.EXERCICIO.NOME,
      },
    };
  }
}
