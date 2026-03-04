export type Exercicio = {
  id: string;
  nome: string;
  order: number;
  pesoUltimoRegistro?: number;
  repUltimoRegistro?: number;
}

export function formatExercicio(exercicio: Exercicio) {
  return `
🏋️ Exercício: ${exercicio.nome}

Último peso: ${exercicio.pesoUltimoRegistro ?? "N/A"}
Últimas reps: ${exercicio.repUltimoRegistro ?? "N/A"}

Use:
-> Para registrar envie: (peso) (repetições)
-> /proximo para avançar para o próximo exercício
-> /voltar para retornar ao exercício anterior
`
}
