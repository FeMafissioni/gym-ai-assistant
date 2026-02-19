"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTreinosFromParsedJsonUseCase = void 0;
const client_1 = require("../../../generated/prisma/client");
const prisma = new client_1.PrismaClient();
class CreateTreinosFromParsedJsonUseCase {
    async execute({ userId, treinos }) {
        return prisma.$transaction(async () => {
            const createdTreinos = [];
            for (const treino of treinos) {
                const createdTreino = await prisma.tREINO.create({
                    data: {
                        USER_ID: userId,
                        NOME: treino.nome,
                    },
                });
                for (const exercicio of treino.exercicios) {
                    let existingExercicio = await prisma.eXERCICIO.findFirst({
                        where: {
                            NOME: exercicio.nome,
                        },
                    });
                    if (!existingExercicio) {
                        existingExercicio = await prisma.eXERCICIO.create({
                            data: {
                                NOME: exercicio.nome,
                            },
                        });
                    }
                    await prisma.tREINO_EXERCICIO.create({
                        data: {
                            TREINO_ID: createdTreino.ID,
                            EXERCICIO_ID: existingExercicio.ID,
                            ORDEM: exercicio.ordem,
                        },
                    });
                }
                createdTreinos.push(createdTreino);
            }
            return createdTreinos;
        });
    }
}
exports.CreateTreinosFromParsedJsonUseCase = CreateTreinosFromParsedJsonUseCase;
