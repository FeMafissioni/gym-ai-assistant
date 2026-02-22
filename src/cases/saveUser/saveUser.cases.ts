import { prisma } from "../../lib/prisma";
import { SaveUserRequest, SaveUserResponse } from "./types/saveUser.types";

export class SaveUserUseCase {
  async execute(
    request: SaveUserRequest
  ): Promise<SaveUserResponse> {

    const { telegramId, nome } = request;

    const existingUser = await prisma.uSER.findUnique({
        where: {
        TELEGRAM_ID: telegramId,
        },
    });

    if (existingUser) {
        if (existingUser.NOME !== nome) {
        await prisma.uSER.update({
            where: { ID: existingUser.ID },
            data: { NOME: nome },
        });
        }

        return {
        id: existingUser.ID,
        telegramId: existingUser.TELEGRAM_ID,
        nome,
        created: false,
        };
    }

    const newUser = await prisma.uSER.create({
        data: {
            TELEGRAM_ID: telegramId,
            NOME: nome,
        },
    });

    return {
        id: newUser.ID,
        telegramId: newUser.TELEGRAM_ID,
        nome: newUser.NOME,
        created: true,
    };
    }
}
