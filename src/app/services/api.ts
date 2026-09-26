import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** Endereço da API: `localhost:8080` em dev, o do Render no build de produção (`src/environments`). */
export const API_URL = environment.apiUrl;

/**
 * Erros de `@Valid` do backend: status 400 com corpo `{ "campo": "mensagem", ... }`.
 * Retorna `null` para qualquer outro formato de erro.
 */
export function errosDeCampo(err: unknown): Record<string, string> | null {
  if (!(err instanceof HttpErrorResponse) || err.status !== 400) {
    return null;
  }
  const corpo: unknown = err.error;
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    return null;
  }
  const entradas = Object.entries(corpo);
  const ehMensagemGeral = 'erro' in corpo || 'Erro' in corpo;
  if (ehMensagemGeral || entradas.length === 0 || entradas.some(([, v]) => typeof v !== 'string')) {
    return null;
  }
  return Object.fromEntries(entradas) as Record<string, string>;
}

/**
 * Extrai a mensagem de erro da API. O backend usa `{ "erro": "..." }` (e `{ "Erro": "..." }` para JSON
 * inválido); erros de validação chegam como `{ "campo": "mensagem" }` e têm as mensagens concatenadas.
 */
export function mensagemErro(err: unknown, padrao: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return padrao;
  }
  const direta = err.error?.erro ?? err.error?.Erro;
  if (typeof direta === 'string') {
    return direta;
  }
  const campos = errosDeCampo(err);
  return campos ? Object.values(campos).join(' ') : padrao;
}
