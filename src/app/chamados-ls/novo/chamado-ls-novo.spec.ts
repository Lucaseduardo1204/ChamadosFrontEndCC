import { ChamadoLsResponse } from '../../models/chamado-ls.model';
import { ChamadoResponse } from '../../models/chamado.model';
import { motivoInelegivel } from './chamado-ls-novo';

const chamado = (id: number, situacao: ChamadoResponse['situacao']) =>
  ({ id, situacao }) as ChamadoResponse;
const ls = (chamadoId: number, situacao: ChamadoLsResponse['situacao'], numeroLs = 'LS-1') =>
  ({ numeroLs, situacao, chamado: { id: chamadoId } }) as ChamadoLsResponse;

describe('quais chamados podem ir para o LS', () => {
  it('chamado aberto ou resolvido sem LS em análise pode', () => {
    expect(motivoInelegivel(chamado(1, 'ABERTA'), [])).toBeNull();
    expect(motivoInelegivel(chamado(1, 'RESOLVIDA'), [ls(1, 'CONCLUIDO')])).toBeNull();
  });

  it('código que não existe, chamado fechado ou já em análise não podem', () => {
    expect(motivoInelegivel(undefined, [])).toBe('Chamado não encontrado.');
    expect(motivoInelegivel(chamado(1, 'FECHADA'), [])).toContain('fechado');
    expect(motivoInelegivel(chamado(1, 'ABERTA'), [ls(1, 'EM_ANALISE', 'LS-77')])).toBe(
      'Este chamado já está em análise no LS (LS-77).',
    );
  });
});
