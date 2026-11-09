import { UsuarioResumo } from './usuario.model';

/** Tamanhos máximos dos campos de texto: os mesmos do `@Size` no backend e das colunas no banco. */
export const LIMITES_CHAMADO = {
  codigoChamado: 20,
  lotacao: 10,
  sistema: 50,
  resumo: 100,
  descricao: 500,
  solicitante: 100,
} as const;

export const SITUACOES = ['ABERTA', 'RESOLVIDA', 'FECHADA'] as const;
export type Situacao = (typeof SITUACOES)[number];

export const PRIORIDADES = ['BLOQUEIO', 'CRITICO', 'NORMAL', 'BAIXA', 'TRIVIAL'] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export const TIPOS = ['SISTEMA', 'TECNICA'] as const;
export type TipoChamado = (typeof TIPOS)[number];

export const SITUACAO_LABEL: Record<Situacao, string> = {
  ABERTA: 'Aberta',
  RESOLVIDA: 'Resolvida',
  FECHADA: 'Fechada',
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  BLOQUEIO: 'Bloqueio',
  CRITICO: 'Crítico',
  NORMAL: 'Normal',
  BAIXA: 'Baixa',
  TRIVIAL: 'Trivial',
};

export const TIPO_LABEL: Record<TipoChamado, string> = {
  SISTEMA: 'Sistema',
  TECNICA: 'Técnica',
};

export interface ChamadoRequest {
  codigoChamado: string;
  /** Texto livre (não é uma fundação fixa). */
  lotacao: string;
  prioridade: Prioridade;
  tipo: TipoChamado;
  sistema: string;
  resumo: string;
  descricao: string;
  /** Texto livre: nome de quem abriu o chamado (não é um usuário cadastrado). */
  solicitante: string;
}

export interface ChamadoResponse {
  id: number;
  codigoChamado: string;
  lotacao: string;
  dataHoraCriacao: string;
  situacao: Situacao;
  prioridade: Prioridade;
  tipo: TipoChamado;
  sistema: string;
  resumo: string;
  descricao: string;
  solicitante: string;
  responsavel: UsuarioResumo | null;
}

export interface AlterarResponsavel {
  responsavelId: number;
}

export interface AlterarSituacao {
  situacao: Situacao;
}
