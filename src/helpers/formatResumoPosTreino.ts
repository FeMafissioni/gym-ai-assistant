import { GetResumoPosTreinoResult } from "../cases/getResumoPosTreino/types/getResumoPosTreino.types";

function formatSigned(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function formatDestaqueLinha(
  tipo: "up" | "down",
  destaque: GetResumoPosTreinoResult["destaques"]["melhores"][number]
) {
  const prefix = tipo === "up" ? "📈" : "📉";
  return `${prefix} ${destaque.exercicioNome}: ${destaque.anterior.peso}kg x ${destaque.anterior.repeticoes} -> ${destaque.atual.peso}kg x ${destaque.atual.repeticoes} (score ${formatSigned(destaque.variacaoScore)})`;
}

export function formatResumoPosTreino(resumo: GetResumoPosTreinoResult) {
  const linhas = [
    `📊 Resumo do treino ${resumo.treino.nome}`,
    `⏱️ Duração: ${resumo.sessao.duracaoMinutos} min`,
    `✅ Exercícios registrados: ${resumo.totais.exerciciosRegistrados}/${resumo.totais.exerciciosPlanejados} (${resumo.totais.taxaConclusaoPercentual}%)`,
  ];

  if (!resumo.comparativo.possuiHistoricoAnterior) {
    linhas.push("📝 Sem sessão anterior deste treino para comparar ainda.");
  } else {
    linhas.push(
      `📌 Comparativo: ${resumo.comparativo.melhorou} melhoraram, ${resumo.comparativo.manteve} mantiveram, ${resumo.comparativo.piorou} caíram`
    );

    if (resumo.comparativo.semHistorico > 0) {
      linhas.push(
        `ℹ️ ${resumo.comparativo.semHistorico} exercício(s) sem histórico de comparação.`
      );
    }
  }

  for (const destaque of resumo.destaques.melhores) {
    linhas.push(formatDestaqueLinha("up", destaque));
  }

  for (const destaque of resumo.destaques.quedas) {
    linhas.push(formatDestaqueLinha("down", destaque));
  }

  return linhas.join("\n");
}

