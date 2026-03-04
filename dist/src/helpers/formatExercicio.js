"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatExercicio = formatExercicio;
function formatExercicio(exercicio) {
    return `
🏋️ Exercício: ${exercicio.nome}

Último peso: ${exercicio.pesoUltimoRegistro ?? "N/A"}
Últimas reps: ${exercicio.repUltimoRegistro ?? "N/A"}

Use:
-> Para registrar envie: (peso) (repetições)
-> /proximo para avançar para o próximo exercício
-> /voltar para retornar ao exercício anterior
`;
}
