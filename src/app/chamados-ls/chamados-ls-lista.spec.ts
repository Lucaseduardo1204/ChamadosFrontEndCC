import { ChamadoLsResponse, SituacaoLs } from '../models/chamado-ls.model';
import { filtrarLs } from './chamados-ls-lista';

function ls(
  id: number,
  numeroLs: string,
  situacao: SituacaoLs,
  resumo = 'Resumo',
  relacionado = true,
): ChamadoLsResponse {
  return {
    id,
    numeroLs,
    resumo,
    lotacao: 'FAEC',
    situacao,
    observacao: null,
    abertoPor: { id: 1, nome: 'Lucas', fundacao: 'FAEC' },
    dataHoraAbertura: '2026-09-20T10:00:00',
    dataHoraConclusao: null,
    chamado: relacionado
      ? {
          id: 10 + id,
          codigoChamado: `SW00${id}`,
          resumo,
          lotacao: 'FAEC',
          situacao: 'ABERTA',
          prioridade: 'NORMAL',
        }
      : null,
  };
}

describe('filtro dos chamados do LS', () => {
  const lista = [
    ls(1, 'LS-100', 'EM_ANALISE', 'Erro no balancete'),
    ls(2, 'LS-200', 'CONCLUIDO'),
    ls(3, 'LS-300', 'EM_ANALISE'),
    ls(4, 'LS-400', 'EM_ANALISE', 'Sem chamado relacionado', false),
  ];
  const ids = (f: Parameters<typeof filtrarLs>[1]) => filtrarLs(lista, f).map((r) => r.id);

  it('filtra por situação ou mostra todas', () => {
    expect(ids({ situacao: 'EM_ANALISE', busca: '' })).toEqual([1, 3, 4]);
    expect(ids({ situacao: 'CONCLUIDO', busca: '' })).toEqual([2]);
    expect(ids({ situacao: 'todas', busca: '' })).toEqual([1, 2, 3, 4]);
  });

  it('pesquisa no número do LS, no código e no resumo do chamado', () => {
    expect(ids({ situacao: 'todas', busca: 'ls-2' })).toEqual([2]);
    expect(ids({ situacao: 'todas', busca: 'sw003' })).toEqual([3]);
    expect(ids({ situacao: 'todas', busca: 'balancete' })).toEqual([1]);
    // Independente: sem código de chamado, a pesquisa usa o número e o resumo do LS
    expect(ids({ situacao: 'todas', busca: 'sem chamado' })).toEqual([4]);
  });
});
