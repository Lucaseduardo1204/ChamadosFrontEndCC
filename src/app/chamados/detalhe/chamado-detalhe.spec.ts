import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ChamadoResponse } from '../../models/chamado.model';
import { Usuario } from '../../models/usuario.model';
import { ChamadoService } from '../../services/chamado.service';
import { UsuarioService } from '../../services/usuario.service';
import { ChamadoDetalhe } from './chamado-detalhe';

const chamado = {
  id: 1,
  codigoChamado: 'SW001',
  lotacao: 'FAEC',
  dataHoraCriacao: '2026-09-26T10:00:00',
  situacao: 'ABERTA',
  prioridade: 'NORMAL',
  tipo: 'SISTEMA',
  sistema: 'Almoxarifado',
  resumo: 'Resumo',
  descricao: 'Descrição',
  solicitante: 'Maria',
  responsavel: { id: 1, nome: 'Ana', fundacao: 'FAEC' },
} as ChamadoResponse;

const usuarios = [
  {
    id: 1,
    nome: 'Ana',
    email: 'ana@x.com',
    tipoUsuario: 'ANALISTA',
    fundacao: 'FAEC',
    ativo: true,
  },
  {
    id: 2,
    nome: 'Bruno',
    email: 'bruno@x.com',
    tipoUsuario: 'ANALISTA',
    fundacao: 'PMA',
    ativo: true,
  },
] as Usuario[];

// Regressão: os formulários da tela não tinham [formGroup], então o (ngSubmit) nunca disparava e o
// navegador fazia o submit nativo — alterar situação, atribuir responsável e comentar não faziam nada.
describe('ChamadoDetalhe', () => {
  let chamadoService: {
    buscar: ReturnType<typeof vi.fn>;
    listarInteracoes: ReturnType<typeof vi.fn>;
    alterarSituacao: ReturnType<typeof vi.fn>;
    alterarResponsavel: ReturnType<typeof vi.fn>;
    comentar: ReturnType<typeof vi.fn>;
  };

  async function renderizar(): Promise<HTMLElement> {
    chamadoService = {
      buscar: vi.fn(() => of(chamado)),
      listarInteracoes: vi.fn(() => of([])),
      alterarSituacao: vi.fn(() => of({ ...chamado, situacao: 'RESOLVIDA' })),
      alterarResponsavel: vi.fn(() =>
        of({ ...chamado, responsavel: { id: 2, nome: 'Bruno', fundacao: 'PMA' } }),
      ),
      comentar: vi.fn(() =>
        of({ id: 1, autor: { id: 1, nome: 'Ana' }, texto: 'Oi', dataHora: '2026-09-26T11:00:00' }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ChamadoDetalhe],
      providers: [
        provideRouter([]),
        { provide: ChamadoService, useValue: chamadoService },
        { provide: UsuarioService, useValue: { listar: () => of(usuarios) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ChamadoDetalhe);
    fixture.componentRef.setInput('id', '1');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function escolher(tela: HTMLElement, rotulo: string, texto: string): void {
    const select = tela.querySelector<HTMLSelectElement>(`select[aria-label="${rotulo}"]`)!;
    select.selectedIndex = [...select.options].findIndex((o) => o.textContent!.trim() === texto);
    select.dispatchEvent(new Event('change'));
  }

  function enviar(tela: HTMLElement, botao: string): void {
    const form = [...tela.querySelectorAll('button')]
      .find((b) => b.textContent!.trim() === botao)!
      .closest('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  it('altera a situação', async () => {
    const tela = await renderizar();
    escolher(tela, 'Nova situação', 'Resolvida');
    enviar(tela, 'Alterar');
    expect(chamadoService.alterarSituacao).toHaveBeenCalledWith(1, 'RESOLVIDA');
  });

  it('atribui o responsável', async () => {
    const tela = await renderizar();
    escolher(tela, 'Responsável', 'Bruno');
    enviar(tela, 'Atribuir');
    expect(chamadoService.alterarResponsavel).toHaveBeenCalledWith(1, 2);
  });

  it('registra um comentário', async () => {
    const tela = await renderizar();
    const textarea = tela.querySelector<HTMLTextAreaElement>('.novo-comentario textarea')!;
    textarea.value = 'Oi';
    textarea.dispatchEvent(new Event('input'));
    enviar(tela, 'Comentar');
    expect(chamadoService.comentar).toHaveBeenCalledWith(1, 'Oi');
  });
});
