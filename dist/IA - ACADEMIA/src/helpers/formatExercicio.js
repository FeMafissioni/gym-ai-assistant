"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatExercicio = formatExercicio;
function formatExercicio(exercicio) {
    return `
🏋️ Exercício: ${exercicio.nome}

Séries: ${exercicio.series}
Reps alvo: ${exercicio.repeticoes}
Carga sugerida: ${exercicio.cargaSugerida || "—"}

Use:
/registrar PESO REP
/proximo
`;
}
