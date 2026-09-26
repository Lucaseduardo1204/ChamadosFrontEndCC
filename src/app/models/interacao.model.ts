import { UsuarioResumo } from './usuario.model';

/** Tamanho máximo do texto de uma interação (mesmo limite do backend). */
export const LIMITE_INTERACAO = 500;

export interface InteracaoRequest {
  texto: string;
}

export interface InteracaoResponse {
  id: number;
  autor: UsuarioResumo;
  texto: string;
  dataHora: string;
}
