export function formatExercicio(exercicio: any) {
  return `
🏋️ Exercício: ${exercicio.nome}

Séries: ${exercicio.series}
Reps alvo: ${exercicio.repeticoes}
Carga sugerida: ${exercicio.cargaSugerida || "—"}

Use:
/registrar PESO REP
/proximo
`
}