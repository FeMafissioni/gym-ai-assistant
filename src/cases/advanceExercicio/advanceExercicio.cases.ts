import { PrismaClient } from "../../../generated/prisma/client";
import { AdvanceExercicioRequest, AdvanceExercicioResult } from "./types/advanceExercicio.types";
import { GetSessaoAtivaUseCase } from "../getSessaoAtiva/getSessaoAtiva.cases";
import { GetCurrentExercicioUseCase } from "../getCurrentExercicio/getCurrentExercicio.cases";


const prisma = new PrismaClient();

export class AdvanceExercicioUseCase {
  async execute(
    request: AdvanceExercicioRequest
  ): Promise<AdvanceExercicioResult> {
    const { userId } = request;

    // 1️⃣ Buscar sessão ativa
    const getActiveSession = new GetSessaoAtivaUseCase();
    const session = await getActiveSession.execute({ userId });

    if (!session.exercicioAtualId) {
      throw new Error("Sessão não possui exercício atual definido.");
    }

    const getCurrent = new GetCurrentExercicioUseCase();
    const current = await getCurrent.execute({ userId });

    const proximoTreinoExercicio = await prisma.tREINO_EXERCICIO.findFirst({
      where: {
        TREINO_ID: session.treinoId,
        ORDEM: current.exercicio.order + 1,
      },
      include: {
        EXERCICIO: true,
      },
    });

    if (!proximoTreinoExercicio) {
      await prisma.sESSAO_TREINO.update({
        where: {
          ID: session.sessionId,
        },
        data: {
          FINALIZADO_EM: new Date(),
        },
      });

      return {
        sessaoId: session.sessionId,
        exercicioAtual: null,
        sessaoFinalizada: true,
      };
    }

    await prisma.sESSAO_TREINO.update({
      where: {
        ID: session.sessionId,
      },
      data: {
        EXERCICIO_ATUAL_ID: proximoTreinoExercicio.EXERCICIO_ID,
      },
    });

    return {
      sessaoId: session.sessionId,
      exercicioAtual: {
        id: proximoTreinoExercicio.EXERCICIO.ID,
        nome: proximoTreinoExercicio.EXERCICIO.NOME,
      },
      sessaoFinalizada: false,
    };
  }
}
