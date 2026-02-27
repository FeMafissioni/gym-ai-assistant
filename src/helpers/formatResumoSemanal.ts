import { GetResumoSemanalResult } from "../cases/getResumoSemanal/types/getResumoSemanal.types";

function formatSigned(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function formatDestaque(
  icon: string,
  item: GetResumoSemanalResult["progressao"]["melhores"][number]
) {
  return `${icon} ${item.exercicioNome}: ${item.primeiro.peso}kg x ${item.primeiro.repeticoes} -> ${item.ultimo.peso}kg x ${item.ultimo.repeticoes} (score ${formatSigned(item.variacaoScore)})`;
}

export function formatResumoSemanal(resumo: GetResumoSemanalResult) {
  const linhas = [
    `📅 Resumo semanal (${resumo.periodo.descricao})`,
    `🏋️ Sessões: ${resumo.totais.sessoesFinalizadas} | Dias treinados: ${resumo.totais.diasTreinados}`,
    `⏱️ Duração média: ${resumo.totais.duracaoMediaMinutos} min`,
    `✅ Conclusão média: ${resumo.totais.taxaConclusaoMediaPercentual}%`,
    `🧾 Registros: ${resumo.totais.exerciciosRegistrados}/${resumo.totais.exerciciosPlanejados} exercícios`,
  ];

  if (resumo.treinosMaisFeitos.length > 0) {
    const topTreinos = resumo.treinosMaisFeitos
      .map((item) => `${item.treinoNome} (${item.totalSessoes})`)
      .join(", ");
    linhas.push(`🔥 Mais feitos: ${topTreinos}`);
  }

  if (resumo.progressao.exerciciosComHistorico > 0) {
    linhas.push(
      `📈 Progresso: ${resumo.progressao.melhoras} melhoraram, ${resumo.progressao.estagnados} mantiveram, ${resumo.progressao.quedas} caíram`
    );

    for (const item of resumo.progressao.melhores.slice(0, 2)) {
      linhas.push(formatDestaque("🚀", item));
    }

    for (const item of resumo.progressao.quedasDetalhes.slice(0, 1)) {
      linhas.push(formatDestaque("⚠️", item));
    }
  } else if (resumo.totais.sessoesFinalizadas > 0) {
    linhas.push("ℹ️ Ainda não há recorrência de exercícios suficiente para medir evolução.");
  } else {
    linhas.push("ℹ️ Você ainda não finalizou sessões nesta semana.");
  }

  if (resumo.comparativoSemanaAnterior.possuiDados) {
    linhas.push(
      `↔️ Vs semana anterior: sessões ${formatSigned(resumo.comparativoSemanaAnterior.sessoesFinalizadasVariacao)}, dias ${formatSigned(resumo.comparativoSemanaAnterior.diasTreinadosVariacao)}, conclusão ${formatSigned(resumo.comparativoSemanaAnterior.taxaConclusaoMediaPercentualVariacao)} pp`
    );
  }

  return linhas.join("\n");
}

