import { prisma } from "../../lib/prisma";
import { GetCurrentExercicioUseCase } from "../getCurrentExercicio/getCurrentExercicio.cases";
import { GetSessaoAtivaUseCase } from "../getSessaoAtiva/getSessaoAtiva.cases";
import {
  PreviousExercicioRequest,
  PreviousExercicioResult,
} from "./types/previousExercicio.types";

export class PreviousExercicioUseCase {
  async execute(
    request: PreviousExercicioRequest
  ): Promise<PreviousExercicioResult> {
    const { userId } = request;

    const getActiveSession = new GetSessaoAtivaUseCase();
    const session = await getActiveSession.execute({ userId });

    if (!session.exercicioAtualId) {
      throw new Error("Sessão não possui exercício atual definido.");
    }

    const getCurrent = new GetCurrentExercicioUseCase();
    const current = await getCurrent.execute({ userId });

    const exercicioAnterior = await prisma.tREINO_EXERCICIO.findFirst({
      where: {
        TREINO_ID: session.treinoId,
        ORDEM: current.order - 1,
      },
      include: {
        EXERCICIO: true,
      },
    });

    if (!exercicioAnterior) {
      return {
        sessaoId: session.sessionId,
        exercicioAtual: null,
        hasPreviousExercicio: false,
      };
    }

    await prisma.sESSAO_TREINO.update({
      where: {
        ID: session.sessionId,
      },
      data: {
        EXERCICIO_ATUAL_ID: exercicioAnterior.EXERCICIO_ID,
      },
    });

    return {
      sessaoId: session.sessionId,
      exercicioAtual: {
        id: exercicioAnterior.EXERCICIO.ID,
        nome: exercicioAnterior.EXERCICIO.NOME,
      },
      hasPreviousExercicio: true,
    };
  }
}
