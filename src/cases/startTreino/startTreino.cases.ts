import { PrismaClient } from "../../../generated/prisma/client";
import { StartTreinoRequest, StartTreinoData } from "./types/startTreino.types";

const prisma = new PrismaClient();

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

    const primeiroExercicio = await prisma.tREINO_EXERCICIO.findFirst({
      where: {
        TREINO_ID: treinoId,
        ORDEM: 1,
      },
      include: {
        TREINO: true,
        EXERCICIO: true,
      },
    });

    if (!primeiroExercicio) {
      throw new Error("Treino não possui exercícios.");
    }

    const sessao = await prisma.sESSAO_TREINO.create({
      data: {
        USER_ID: userId,
        TREINO_ID: treinoId,
        INICIADO_EM: new Date(),
        EXERCICIO_ATUAL_ID: primeiroExercicio.EXERCICIO_ID,
      },
    });

    return {
      sessaoId: sessao.ID,
      treinoNome: primeiroExercicio.TREINO.NOME,
      primeiroExercicio: {
        id: primeiroExercicio.EXERCICIO_ID,
        nome: primeiroExercicio.EXERCICIO.NOME,
      },
    };
  }
}
