import { ChamadoResponse } from '../models/chamado.model';
import {
  FILTROS_VAZIOS,
  SEM_RESPONSAVEL,
  filtrarChamados,
  filtrosDaUrl,
  filtrosParaUrl,
  lotacoesDistintas,
  responsaveisDistintos,
  temFiltro,
} from './filtros';

function chamado(dados: Partial<ChamadoResponse>): ChamadoResponse {
  return {
    id: 1,
    codigoChamado: 'SW001',
    lotacao: 'FAEC',
    dataHoraCriacao: '2026-09-20T14:30:00',
    situacao: 'ABERTA',
    prioridade: 'NORMAL',
    tipo: 'SISTEMA',
    sistema: 'Frotas',
    resumo: 'Resumo',
    descricao: 'Descrição',
    solicitante: 'Maria',
    responsavel: null,
    ...dados,
  };
}

const ana = { id: 5, nome: 'Ana', fundacao: 'FAEC' as const };

describe('filtros de chamados', () => {
  const chamados = [
    chamado({ id: 1, codigoChamado: 'SW001', situacao: 'ABERTA', lotacao: 'FAEC' }),
    chamado({
      id: 2,
      codigoChamado: 'SW002',
      situacao: 'FECHADA',
      lotacao: 'Sede',
      responsavel: ana,
      dataHoraCriacao: '2026-09-25T08:00:00',
    }),
    chamado({
      id: 3,
      codigoChamado: 'GRP-3',
      prioridade: 'CRITICO',
      tipo: 'TECNICA',
      solicitante: 'João',
    }),
  ];
  const ids = (lista: ChamadoResponse[]) => lista.map((c) => c.id);
  const filtrar = (f: object) => ids(filtrarChamados(chamados, { ...FILTROS_VAZIOS, ...f }));

  it('sem filtros devolve tudo, do mais recente para o mais antigo', () => {
    expect(filtrar({})).toEqual([2, 1, 3]);
  });

  it('combina os filtros', () => {
    expect(filtrar({ situacao: ['ABERTA'] })).toEqual([1, 3]);
    expect(filtrar({ situacao: ['ABERTA'], prioridade: ['CRITICO'] })).toEqual([3]);
    expect(filtrar({ tipo: ['TECNICA'] })).toEqual([3]);
    expect(filtrar({ busca: 'joão' })).toEqual([3]);
  });

  it('vários valores no mesmo filtro somam os resultados', () => {
    expect(filtrar({ lotacao: ['FAEC', 'Sede'] })).toEqual([2, 1, 3]);
    expect(filtrar({ situacao: ['ABERTA', 'FECHADA'], tipo: ['SISTEMA'] })).toEqual([2, 1]);
    expect(filtrar({ prioridade: ['CRITICO', 'BAIXA'] })).toEqual([3]);
  });

  it('lotação ignora maiúsculas e espaços', () => {
    expect(filtrar({ lotacao: [' sede '] })).toEqual([2]);
  });

  it('filtra por responsável, pela falta dele ou pelos dois', () => {
    expect(filtrar({ responsavel: ['5'] })).toEqual([2]);
    expect(filtrar({ responsavel: [SEM_RESPONSAVEL] })).toEqual([1, 3]);
    expect(filtrar({ responsavel: ['5', SEM_RESPONSAVEL] })).toEqual([2, 1, 3]);
  });

  it('período usa a data de criação com os dois extremos inclusivos', () => {
    expect(filtrar({ de: '2026-09-25' })).toEqual([2]);
    expect(filtrar({ ate: '2026-09-20' })).toEqual([1, 3]);
    expect(filtrar({ de: '2026-09-20', ate: '2026-09-25' })).toEqual([2, 1, 3]);
  });

  it('lê a URL descartando valores inválidos', () => {
    const f = filtrosDaUrl({
      situacao: 'XYZ',
      prioridade: 'BAIXA',
      de: '20/09/2026',
      ate: '2026-09-30',
    });
    expect(f.situacao).toEqual([]);
    expect(f.prioridade).toEqual(['BAIXA']);
    expect(f.de).toBe('');
    expect(f.ate).toBe('2026-09-30');
  });

  it('lê parâmetros repetidos como vários valores, sem duplicar', () => {
    const f = filtrosDaUrl({
      lotacao: ['FAEC', 'FAMEP', 'FAEC', ''],
      situacao: ['ABERTA', 'XYZ', 'FECHADA'],
    });
    expect(f.lotacao).toEqual(['FAEC', 'FAMEP']);
    expect(f.situacao).toEqual(['ABERTA', 'FECHADA']);
    expect(f.responsavel).toEqual([]);
  });

  it('filtros vazios somem da URL', () => {
    expect(filtrosParaUrl({ situacao: ['ABERTA'], lotacao: [], busca: '' })).toEqual({
      situacao: ['ABERTA'],
      lotacao: null,
      busca: null,
    });
  });

  it('sabe quando há filtro', () => {
    expect(temFiltro(FILTROS_VAZIOS)).toBe(false);
    expect(temFiltro({ ...FILTROS_VAZIOS, lotacao: ['FAEC'] })).toBe(true);
    expect(temFiltro({ ...FILTROS_VAZIOS, busca: 'x' })).toBe(true);
  });

  it('opções dos selects vêm dos dados', () => {
    expect(lotacoesDistintas(chamados)).toEqual(['FAEC', 'Sede']);
    expect(responsaveisDistintos(chamados)).toEqual([{ id: 5, nome: 'Ana' }]);
  });
});
