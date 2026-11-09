import { Params } from '@angular/router';
import {
  ChamadoResponse,
  PRIORIDADES,
  Prioridade,
  SITUACOES,
  Situacao,
  TIPOS,
  TipoChamado,
} from '../models/chamado.model';

/** Valor do filtro de responsável para "chamados sem responsável". */
export const SEM_RESPONSAVEL = 'nenhum';

/**
 * Filtros da lista de chamados. Todos opcionais; `''` ou `[]` = sem filtro.
 * Os de lista aceitam vários valores ao mesmo tempo (ex.: lotação FAEC **ou** FAMEP): dentro de um
 * mesmo filtro os valores se somam (OU) e filtros diferentes se combinam (E).
 * Ficam na URL (query params, repetidos para vários valores: `?lotacao=FAEC&lotacao=FAMEP`) para que
 * o dashboard possa abrir a lista já filtrada e para que o filtro sobreviva a um F5 ou a um link.
 */
export interface FiltrosChamado {
  busca: string;
  situacao: Situacao[];
  prioridade: Prioridade[];
  tipo: TipoChamado[];
  lotacao: string[];
  /** Ids dos responsáveis e/ou `SEM_RESPONSAVEL`. */
  responsavel: string[];
  /** Datas `AAAA-MM-DD` (inclusivas) comparadas com a data de criação. */
  de: string;
  ate: string;
}

/** Filtros que aceitam vários valores. */
export type FiltroMultiplo = 'situacao' | 'prioridade' | 'tipo' | 'lotacao' | 'responsavel';

export const FILTROS_VAZIOS: FiltrosChamado = {
  busca: '',
  situacao: [],
  prioridade: [],
  tipo: [],
  lotacao: [],
  responsavel: [],
  de: '',
  ate: '',
};

const DATA = /^\d{4}-\d{2}-\d{2}$/;

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

/** Um query param pode chegar como texto (um valor) ou lista (repetido); devolve os textos não vazios, sem repetição. */
function lista(valor: unknown): string[] {
  const valores = Array.isArray(valor) ? valor : [valor];
  return [...new Set(valores.map(texto).filter((v) => v !== ''))];
}

function variosDe<T extends string>(valores: readonly T[], valor: unknown): T[] {
  return lista(valor).filter((v): v is T => valores.includes(v as T));
}

/** Lê os filtros dos query params, descartando valores inválidos. */
export function filtrosDaUrl(params: Params): FiltrosChamado {
  const data = (valor: unknown) => (DATA.test(texto(valor)) ? texto(valor) : '');
  return {
    busca: texto(params['busca']),
    situacao: variosDe(SITUACOES, params['situacao']),
    prioridade: variosDe(PRIORIDADES, params['prioridade']),
    tipo: variosDe(TIPOS, params['tipo']),
    lotacao: lista(params['lotacao']),
    responsavel: lista(params['responsavel']),
    de: data(params['de']),
    ate: data(params['ate']),
  };
}

/** Query params só com os filtros preenchidos (os vazios viram `null`, que o router remove). */
export function filtrosParaUrl(filtros: Partial<FiltrosChamado>): Params {
  return Object.fromEntries(
    Object.entries(filtros).map(([chave, valor]) => [
      chave,
      (Array.isArray(valor) ? valor.length > 0 : valor) ? valor : null,
    ]),
  );
}

export function temFiltro(filtros: FiltrosChamado): boolean {
  return Object.values(filtros).some((valor) => valor.length > 0);
}

/** `dataHoraCriacao` vem como LocalDateTime (`2026-09-20T14:30:00`); os 10 primeiros caracteres são a data. */
export function dataDoChamado(chamado: ChamadoResponse): string {
  return chamado.dataHoraCriacao.slice(0, 10);
}

export function filtrarChamados(chamados: ChamadoResponse[], f: FiltrosChamado): ChamadoResponse[] {
  const termo = f.busca.trim().toLowerCase();
  const lotacoes = new Set(f.lotacao.map((l) => l.trim().toLowerCase()));
  /** Filtro vazio aceita tudo; com valores, basta bater com um deles. */
  const aceita = <T>(valores: readonly T[], valor: T) =>
    valores.length === 0 || valores.includes(valor);
  return (
    chamados
      .filter((c) => {
        const data = dataDoChamado(c);
        return (
          (!termo ||
            [c.codigoChamado, c.resumo, c.solicitante].some((v) =>
              v.toLowerCase().includes(termo),
            )) &&
          aceita(f.situacao, c.situacao) &&
          aceita(f.prioridade, c.prioridade) &&
          aceita(f.tipo, c.tipo) &&
          (lotacoes.size === 0 || lotacoes.has(c.lotacao.trim().toLowerCase())) &&
          aceita(f.responsavel, c.responsavel ? String(c.responsavel.id) : SEM_RESPONSAVEL) &&
          (!f.de || data >= f.de) &&
          (!f.ate || data <= f.ate)
        );
      })
      // Mais recentes primeiro (os de hoje no topo); LocalDateTime em ISO ordena como texto
      .sort((a, b) => b.dataHoraCriacao.localeCompare(a.dataHoraCriacao))
  );
}

/** Valores distintos, ordenados, para popular selects (lotação e responsável são dados, não enums). */
export function lotacoesDistintas(chamados: ChamadoResponse[]): string[] {
  return [...new Set(chamados.map((c) => c.lotacao))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function responsaveisDistintos(chamados: ChamadoResponse[]): { id: number; nome: string }[] {
  const porId = new Map<number, string>();
  for (const c of chamados) {
    if (c.responsavel) porId.set(c.responsavel.id, c.responsavel.nome);
  }
  return [...porId]
    .map(([id, nome]) => ({ id, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
