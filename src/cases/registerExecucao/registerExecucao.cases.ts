import { PrismaClient } from "@prisma/client";

import { GetSessaoAtivaUseCase } from "../getSessaoAtiva/getSessaoAtiva.cases";
import { RegisterExecucaoRequest, RegisterExecucaoResult } from "./types/registerExecucao.types";

const prisma = new PrismaClient();

export class RegisterExecucaoUseCase {
  async execute(
    request: RegisterExecucaoRequest
  ): Promise<RegisterExecucaoResult> {
    const { userId, peso, repeticoes } = request;

    const getActiveSession = new GetSessaoAtivaUseCase();
    const session = await getActiveSession.execute({ userId });

    if (!session.exercicioAtualId) {
      throw new Error("Sessão não possui exercício atual definido.");
    }

    await prisma.eXECUCAO_EXERCICIO.upsert({
      where: {
        SESSAO_TREINO_ID_EXERCICIO_ID: {
          SESSAO_TREINO_ID: session.sessionId,
          EXERCICIO_ID: session.exercicioAtualId,
        },
      },
      update: {
        PESO: peso,
        REPETICOES: repeticoes,
      },
      create: {
        SESSAO_TREINO_ID: session.sessionId,
        EXERCICIO_ID: session.exercicioAtualId,
        PESO: peso,
        REPETICOES: repeticoes,
      },
    });

    const exercicio = await prisma.eXERCICIO.findUnique({
      where: { ID: session.exercicioAtualId },
    });

    return {
      exercicioAtual: {
        id: exercicio!.ID,
        nome: exercicio!.NOME,
      },
    };
  }
}
