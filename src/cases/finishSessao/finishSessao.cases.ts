import { PrismaClient } from "../../../generated/prisma/client";
import { GetSessaoAtivaUseCase } from "../getSessaoAtiva/getSessaoAtiva.cases";
import { FinishSessaoRequest, FinishSessaoResult } from "./types/finishSessao.types";


const prisma = new PrismaClient();

export class FinishSessaoUseCase {
  async execute(
    request: FinishSessaoRequest
  ): Promise<FinishSessaoResult> {
    const { userId } = request;

    // 1️⃣ Buscar sessão ativa
    const getActiveSession = new GetSessaoAtivaUseCase();
    const session = await getActiveSession.execute({ userId });

    if (session.dataFinalizado) {
      throw new Error("Sessão já está finalizada.");
    }

    // 2️⃣ Finalizar sessão
    const sessaoFinalizada = await prisma.sESSAO_TREINO.update({
      where: {
        ID: session.sessionId,
      },
      data: {
        FINALIZADO_EM: new Date(),
      },
    });

    return {
      sessaoId: sessaoFinalizada.ID,
      finalizadaEm: sessaoFinalizada.FINALIZADO_EM!,
    };
  }
}
