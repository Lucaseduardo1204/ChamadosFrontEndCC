export const FUNDACOES = ['FAEC', 'FAMEP', 'PMA'] as const;
export type Fundacao = (typeof FUNDACOES)[number];

export const TIPOS_USUARIO = ['ANALISTA', 'SOLICITANTE'] as const;
export type TipoUsuario = (typeof TIPOS_USUARIO)[number];

export const TIPO_USUARIO_LABEL: Record<TipoUsuario, string> = {
  ANALISTA: 'Analista',
  SOLICITANTE: 'Solicitante',
};

/** Mesmos limites do `@Size` no backend; a senha vai até 72 caracteres, o máximo que o BCrypt considera. */
export const LIMITES_USUARIO = {
  nome: 100,
  email: 100,
  senhaMin: 8,
  senhaMax: 72,
} as const;

export interface UsuarioResumo {
  id: number;
  nome: string;
  fundacao: Fundacao;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  fundacao: Fundacao;
  /** Usuário inativo não consegue entrar e não pode ser responsável por chamados. */
  ativo: boolean;
}

export interface UsuarioRequest {
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  fundacao: Fundacao;
  senha: string;
}

/** Edição dos dados cadastrais; a senha tem rota própria. */
export type UsuarioAtualizacao = Omit<UsuarioRequest, 'senha'>;
