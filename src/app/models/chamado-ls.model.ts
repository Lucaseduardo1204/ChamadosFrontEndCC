import { Prioridade, Situacao } from './chamado.model';
import { UsuarioResumo } from './usuario.model';

/** Chamado aberto no LS (intranet) por um analista; pode ou não estar relacionado a um chamado deste sistema. */
export const SITUACOES_LS = ['EM_ANALISE', 'CONCLUIDO', 'CANCELADO'] as const;
export type SituacaoLs = (typeof SITUACOES_LS)[number];

export const SITUACAO_LS_LABEL: Record<SituacaoLs, string> = {
  EM_ANALISE: 'Em análise',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

/** Mesmos limites do `@Size` no backend e das colunas de `chamados_ls`. */
export const LIMITES_LS = {
  numeroLs: 20,
  resumo: 100,
  lotacao: 10,
  observacao: 500,
} as const;

/**
 * Resumo e lotação são obrigatórios só sem chamado relacionado; com chamado, em branco o backend copia os dele.
 * `chamadoId` só é usado em `POST /chamados-ls` (em `/chamados/{id}/ls` o chamado vem da URL).
 */
export interface ChamadoLsRequest {
  numeroLs: string;
  resumo?: string | null;
  lotacao?: string | null;
  observacao: string | null;
  chamadoId?: number | null;
}

/** Só CONCLUIDO ou CANCELADO: EM_ANALISE é o estado inicial e não volta. */
export interface AlterarSituacaoLs {
  situacao: Exclude<SituacaoLs, 'EM_ANALISE'>;
  observacao: string | null;
}

export interface ChamadoLsResponse {
  id: number;
  numeroLs: string;
  resumo: string;
  lotacao: string | null;
  situacao: SituacaoLs;
  observacao: string | null;
  abertoPor: UsuarioResumo;
  dataHoraAbertura: string;
  dataHoraConclusao: string | null;
  /** `null` quando o chamado do LS é independente. */
  chamado: {
    id: number;
    codigoChamado: string;
    resumo: string;
    lotacao: string;
    situacao: Situacao;
    prioridade: Prioridade;
  } | null;
}
