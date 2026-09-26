import { HttpErrorResponse } from '@angular/common/http';
import { errosDeCampo, mensagemErro } from './api';

function erroHttp(status: number, error: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('mensagemErro', () => {
  it('usa o campo "erro" do corpo', () => {
    expect(mensagemErro(erroHttp(404, { erro: 'Chamado não encontrado' }), 'padrão')).toBe(
      'Chamado não encontrado',
    );
  });

  it('usa o campo "Erro" (JSON inválido no backend)', () => {
    expect(mensagemErro(erroHttp(400, { Erro: 'Valor inválido' }), 'padrão')).toBe(
      'Valor inválido',
    );
  });

  it('concatena as mensagens de validação por campo', () => {
    const err = erroHttp(400, {
      resumo: 'Resumo não pode ser nulo!',
      solicitante: 'Solicitante é obrigatório!',
    });
    expect(mensagemErro(err, 'padrão')).toBe(
      'Resumo não pode ser nulo! Solicitante é obrigatório!',
    );
  });

  it('cai no padrão para corpos desconhecidos', () => {
    const springPadrao = {
      timestamp: '2026-09-25T10:00:00',
      status: 500,
      error: 'Internal Server Error',
    };
    expect(mensagemErro(erroHttp(500, springPadrao), 'padrão')).toBe('padrão');
    expect(mensagemErro(erroHttp(400, new Blob()), 'padrão')).toBe('padrão');
    expect(mensagemErro(new Error('x'), 'padrão')).toBe('padrão');
  });
});

describe('errosDeCampo', () => {
  it('só reconhece 400 com mapa campo → mensagem', () => {
    expect(errosDeCampo(erroHttp(400, { texto: 'must not be blank' }))).toEqual({
      texto: 'must not be blank',
    });
    expect(errosDeCampo(erroHttp(422, { texto: 'x' }))).toBeNull();
    expect(errosDeCampo(erroHttp(400, { erro: 'x' }))).toBeNull();
    expect(errosDeCampo(erroHttp(400, { status: 400, error: 'Bad Request' }))).toBeNull();
  });
});
