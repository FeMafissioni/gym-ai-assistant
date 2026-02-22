import { prisma } from "../../lib/prisma";
import { GetListTreinosRequest, GetListTreinosResponse } from "./types/getUserTreinos.types";

export class GetUserTreinosUseCase {
  async execute(
    request: GetListTreinosRequest
  ): Promise<GetListTreinosResponse> {
    const { userId } = request;

    const userTreinos = await prisma.tREINO.findMany({
      where: {
        USER_ID: userId,
      },
      select: {
        ID: true,
        NOME: true,
      },
    });

    return {
      treinos: userTreinos.map((treino) => ({
        treinoId: treino.ID,
        nome: treino.NOME,
      })),
    };
  }
}
