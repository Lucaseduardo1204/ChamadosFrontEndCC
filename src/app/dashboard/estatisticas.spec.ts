import { ChamadoLsResponse } from '../models/chamado-ls.model';
import { ChamadoResponse } from '../models/chamado.model';
import {
  abertosPorResponsavel,
  diasAtras,
  emAnaliseNoLs,
  porLotacao,
  porPrioridade,
  porSituacao,
  resumo,
  serieTemporal,
} from './estatisticas';

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

describe('estatísticas do dashboard', () => {
  it('em análise no LS conta só chamados do recorte com LS em análise', () => {
    const ls = (id: number, chamadoId: number, situacao: ChamadoLsResponse['situacao']) =>
      ({ id, situacao, chamado: { id: chamadoId } }) as ChamadoLsResponse;
    const recorte = [chamado({ id: 1 }), chamado({ id: 2 }), chamado({ id: 3 })];

    const total = emAnaliseNoLs(recorte, [
      ls(10, 1, 'EM_ANALISE'),
      ls(11, 2, 'CONCLUIDO'),
      ls(12, 3, 'CANCELADO'),
      ls(13, 99, 'EM_ANALISE'), // chamado fora do período/lotação
    ]);

    expect(total).toBe(1);
  });

  it('resume os totais', () => {
    const r = resumo([
      chamado({ situacao: 'ABERTA', prioridade: 'CRITICO' }),
      chamado({ situacao: 'ABERTA', responsavel: ana }),
      chamado({ situacao: 'RESOLVIDA', prioridade: 'BLOQUEIO' }),
      chamado({ situacao: 'FECHADA' }),
    ]);
    expect(r).toEqual({
      total: 4,
      abertos: 2,
      resolvidos: 1,
      fechados: 1,
      abertosSemResponsavel: 1,
      abertosUrgentes: 1,
    });
  });

  it('situação e prioridade mantêm a ordem fixa, com zeros', () => {
    const chamados = [chamado({ situacao: 'FECHADA', prioridade: 'TRIVIAL' })];
    expect(porSituacao(chamados).map((b) => [b.rotulo, b.valor])).toEqual([
      ['Aberta', 0],
      ['Resolvida', 0],
      ['Fechada', 1],
    ]);
    expect(porPrioridade(chamados).map((b) => b.classe)).toEqual([
      'prioridade-BLOQUEIO',
      'prioridade-CRITICO',
      'prioridade-NORMAL',
      'prioridade-BAIXA',
      'prioridade-TRIVIAL',
    ]);
  });

  it('lotação vai da maior para a menor e junta o excedente em "Outros"', () => {
    const chamados = [
      ...Array.from({ length: 3 }, () => chamado({ lotacao: 'Sede' })),
      ...'ABCDEFGHI'.split('').map((l) => chamado({ lotacao: l })),
    ];
    const barras = porLotacao(chamados);
    expect(barras).toHaveLength(8);
    expect(barras[0]).toMatchObject({ rotulo: 'Sede', valor: 3, filtro: { lotacao: ['Sede'] } });
    expect(barras[7]).toMatchObject({ rotulo: 'Outros (3)', valor: 3, filtro: {} });
  });

  it('carga por responsável conta só os abertos e leva ao filtro certo', () => {
    const barras = abertosPorResponsavel([
      chamado({ responsavel: ana }),
      chamado({ responsavel: ana }),
      chamado({ responsavel: ana, situacao: 'FECHADA' }),
      chamado({}),
    ]);
    expect(barras).toEqual([
      { rotulo: 'Ana', valor: 2, filtro: { situacao: ['ABERTA'], responsavel: ['5'] } },
      {
        rotulo: 'Sem responsável',
        valor: 1,
        filtro: { situacao: ['ABERTA'], responsavel: ['nenhum'] },
      },
    ]);
  });

  it('série diária preenche os dias sem chamados com zero', () => {
    const serie = serieTemporal(
      [
        chamado({ dataHoraCriacao: '2026-09-28T10:00:00' }),
        chamado({ dataHoraCriacao: '2026-09-30T23:59:00' }),
      ],
      '2026-09-28',
      '2026-10-01',
      'dia',
    );
    expect(serie.map((p) => [p.inicio, p.valor])).toEqual([
      ['2026-09-28', 1],
      ['2026-09-29', 0],
      ['2026-09-30', 1],
      ['2026-10-01', 0],
    ]);
  });

  it('série mensal recorta o primeiro e o último mês no intervalo', () => {
    const serie = serieTemporal(
      [chamado({ dataHoraCriacao: '2026-08-15T10:00:00' })],
      '2026-07-20',
      '2026-09-10',
      'mes',
    );
    expect(serie).toEqual([
      { inicio: '2026-07-20', fim: '2026-07-31', valor: 0 },
      { inicio: '2026-08-01', fim: '2026-08-31', valor: 1 },
      { inicio: '2026-09-01', fim: '2026-09-10', valor: 0 },
    ]);
  });

  it('dias atrás usa a data local', () => {
    expect(diasAtras(new Date(2026, 2, 1), 1)).toBe('2026-02-28');
  });
});
