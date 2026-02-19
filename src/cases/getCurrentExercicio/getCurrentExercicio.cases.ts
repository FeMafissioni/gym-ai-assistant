import { PrismaClient } from "../../../generated/prisma/client";
import { GetCurrentExercicioRequest, GetCurrentExercicioResult } from "./types/getCurrentExercicio.types";
import { GetSessaoAtivaUseCase } from "../getSessaoAtiva/getSessaoAtiva.cases";


const prisma = new PrismaClient();

export class GetCurrentExercicioUseCase {
  async execute(
    request: GetCurrentExercicioRequest
  ): Promise<GetCurrentExercicioResult> {
    const { userId } = request;

    // 1️⃣ Buscar sessão ativa
    const getActiveSession = new GetSessaoAtivaUseCase();
    const session = await getActiveSession.execute({ userId });

    if (!session.exercicioAtualId) {
      throw new Error("Sessão ativa não possui exercício atual definido.");
    }

    // 2️⃣ Buscar exercício atual
    const exercicio = await prisma.tREINO_EXERCICIO.findFirst({
      where: {
        TREINO_ID: session.treinoId,
        EXERCICIO_ID: session.exercicioAtualId,
      },
      include: {
        EXERCICIO: true,
      },
    });

    if (!exercicio) {
      throw new Error("Exercício atual não encontrado.");
    }

    return {
      sessaoId: session.sessionId,
      exercicio: {
        id: exercicio.ID,
        nome: exercicio.EXERCICIO.NOME,
        order: exercicio.ORDEM,
      },
    };
  }
}
