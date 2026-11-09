import {
  ChamadoResponse,
  PRIORIDADES,
  PRIORIDADE_LABEL,
  SITUACOES,
  SITUACAO_LABEL,
  TIPOS,
  TIPO_LABEL,
} from '../models/chamado.model';
import { FiltrosChamado, SEM_RESPONSAVEL, dataDoChamado } from '../chamados/filtros';
import { ChamadoLsResponse } from '../models/chamado-ls.model';

/** Uma barra do dashboard; `filtro` abre a lista de chamados já filtrada. */
export interface Barra {
  rotulo: string;
  valor: number;
  /** Classe de badge (`situacao-ABERTA`, `prioridade-CRITICO`) quando a cor tem significado. */
  classe?: string;
  filtro: Partial<FiltrosChamado>;
}

/** Um ponto da série temporal: `inicio`/`fim` em `AAAA-MM-DD` (inclusivos). */
export interface Ponto {
  inicio: string;
  fim: string;
  valor: number;
}

export type Granularidade = 'dia' | 'mes';

/** Quantos itens mostrar antes de juntar o resto em "Outros". */
const MAX_BARRAS = 8;

/** Data local (não UTC) em `AAAA-MM-DD`, o mesmo formato de `dataDoChamado`. */
export function formatarData(data: Date): string {
  const d = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  return `${data.getFullYear()}-${m}-${d}`;
}

export function diasAtras(hoje: Date, dias: number): string {
  const data = new Date(hoje);
  data.setDate(data.getDate() - dias);
  return formatarData(data);
}

export function resumo(chamados: ChamadoResponse[]) {
  const abertos = chamados.filter((c) => c.situacao === 'ABERTA');
  return {
    total: chamados.length,
    abertos: abertos.length,
    resolvidos: chamados.filter((c) => c.situacao === 'RESOLVIDA').length,
    fechados: chamados.filter((c) => c.situacao === 'FECHADA').length,
    abertosSemResponsavel: abertos.filter((c) => c.responsavel === null).length,
    abertosUrgentes: abertos.filter(
      (c) => c.prioridade === 'BLOQUEIO' || c.prioridade === 'CRITICO',
    ).length,
  };
}

function contar(chamados: ChamadoResponse[], chave: (c: ChamadoResponse) => string) {
  const contagem = new Map<string, number>();
  for (const c of chamados) {
    contagem.set(chave(c), (contagem.get(chave(c)) ?? 0) + 1);
  }
  return contagem;
}

/**
 * Chamados do recorte que estão em análise no LS. Conta chamados, não registros do LS
 * (só existe um em análise por chamado, mas assim o número nunca passa do total).
 */
export function emAnaliseNoLs(chamados: ChamadoResponse[], registrosLs: ChamadoLsResponse[]) {
  const ids = new Set(chamados.map((c) => c.id));
  return new Set(
    registrosLs
      .filter((ls) => ls.situacao === 'EM_ANALISE' && ls.chamado && ids.has(ls.chamado.id))
      .map((ls) => ls.chamado!.id),
  ).size;
}

/** Enums em ordem fixa, mesmo com zero (a ordem já carrega significado: prioridade, fluxo da situação). */
export function porSituacao(chamados: ChamadoResponse[]): Barra[] {
  const contagem = contar(chamados, (c) => c.situacao);
  return SITUACOES.map((s) => ({
    rotulo: SITUACAO_LABEL[s],
    valor: contagem.get(s) ?? 0,
    classe: `situacao-${s}`,
    filtro: { situacao: [s] },
  }));
}

export function porPrioridade(chamados: ChamadoResponse[]): Barra[] {
  const contagem = contar(chamados, (c) => c.prioridade);
  return PRIORIDADES.map((p) => ({
    rotulo: PRIORIDADE_LABEL[p],
    valor: contagem.get(p) ?? 0,
    classe: `prioridade-${p}`,
    filtro: { prioridade: [p] },
  }));
}

export function porTipo(chamados: ChamadoResponse[]): Barra[] {
  const contagem = contar(chamados, (c) => c.tipo);
  return TIPOS.map((t) => ({
    rotulo: TIPO_LABEL[t],
    valor: contagem.get(t) ?? 0,
    filtro: { tipo: [t] },
  }));
}

/** Da maior para a menor; passando de `MAX_BARRAS`, o resto vira "Outros" (sem filtro). */
function ordenarComOutros(barras: Barra[]): Barra[] {
  const ordenadas = [...barras].sort(
    (a, b) => b.valor - a.valor || a.rotulo.localeCompare(b.rotulo, 'pt-BR'),
  );
  if (ordenadas.length <= MAX_BARRAS) return ordenadas;
  const resto = ordenadas.slice(MAX_BARRAS - 1);
  return [
    ...ordenadas.slice(0, MAX_BARRAS - 1),
    {
      rotulo: `Outros (${resto.length})`,
      valor: resto.reduce((soma, b) => soma + b.valor, 0),
      filtro: {},
    },
  ];
}

export function porLotacao(chamados: ChamadoResponse[]): Barra[] {
  return ordenarComOutros(
    [...contar(chamados, (c) => c.lotacao)].map(([lotacao, valor]) => ({
      rotulo: lotacao,
      valor,
      filtro: { lotacao: [lotacao] },
    })),
  );
}

/** A lista não filtra por sistema, então estas barras não levam a ela (`filtro` vazio). */
export function porSistema(chamados: ChamadoResponse[]): Barra[] {
  return ordenarComOutros(
    [...contar(chamados, (c) => c.sistema)].map(([sistema, valor]) => ({
      rotulo: sistema,
      valor,
      filtro: {},
    })),
  );
}

/** Carga de trabalho: só chamados em aberto, por responsável. */
export function abertosPorResponsavel(chamados: ChamadoResponse[]): Barra[] {
  const abertos = chamados.filter((c) => c.situacao === 'ABERTA');
  const nomes = new Map<string, string>();
  const contagem = contar(abertos, (c) => {
    if (!c.responsavel) return SEM_RESPONSAVEL;
    nomes.set(String(c.responsavel.id), c.responsavel.nome);
    return String(c.responsavel.id);
  });
  return ordenarComOutros(
    [...contagem].map(([id, valor]) => ({
      rotulo: id === SEM_RESPONSAVEL ? 'Sem responsável' : nomes.get(id)!,
      valor,
      filtro: { situacao: ['ABERTA'], responsavel: [id] },
    })),
  );
}

function proximoDia(data: string): string {
  const [a, m, d] = data.split('-').map(Number);
  return formatarData(new Date(a, m - 1, d + 1));
}

function fimDoMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return formatarData(new Date(a, m, 0));
}

function proximoMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return formatarData(new Date(a, m, 1)).slice(0, 7);
}

/**
 * Chamados abertos por dia (ou por mês) entre `de` e `ate`, com zero nos períodos sem chamados
 * — um buraco na série é informação, não pode sumir do gráfico.
 */
export function serieTemporal(
  chamados: ChamadoResponse[],
  de: string,
  ate: string,
  granularidade: Granularidade,
): Ponto[] {
  if (!de || !ate || de > ate) return [];
  const pontos: Ponto[] = [];
  if (granularidade === 'dia') {
    const contagem = contar(chamados, dataDoChamado);
    for (let dia = de; dia <= ate; dia = proximoDia(dia)) {
      pontos.push({ inicio: dia, fim: dia, valor: contagem.get(dia) ?? 0 });
    }
  } else {
    const contagem = contar(chamados, (c) => dataDoChamado(c).slice(0, 7));
    for (let mes = de.slice(0, 7); mes <= ate.slice(0, 7); mes = proximoMes(mes)) {
      pontos.push({
        inicio: `${mes}-01` < de ? de : `${mes}-01`,
        fim: fimDoMes(mes) > ate ? ate : fimDoMes(mes),
        valor: contagem.get(mes) ?? 0,
      });
    }
  }
  return pontos;
}
