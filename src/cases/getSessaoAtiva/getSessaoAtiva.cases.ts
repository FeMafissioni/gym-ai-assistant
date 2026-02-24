import { prisma } from "../../lib/prisma";
import { ActiveSessionData, GetActiveSessionRequest } from "./types/getSessaoAtiva.types";

export class GetSessaoAtivaUseCase {
  async execute(
    request: GetActiveSessionRequest
  ): Promise<ActiveSessionData> {
    const { userId } = request;

    const session = await prisma.sESSAO_TREINO.findFirst({
      where: {
        USER_ID: userId,
        FINALIZADO_EM: null,
      },
      include: {
        TREINO: true,
      },
    });

    if (!session) {
      throw new Error("Você não possui sessão de treino ativa.");
    }

    return {
      sessionId: session.ID,
      treinoId: session.TREINO_ID,
      treinoNome: session.TREINO.NOME,
      exercicioAtualId: session.EXERCICIO_ATUAL_ID,
      dataFinalizado: session.FINALIZADO_EM || undefined,
    };
  }
}
