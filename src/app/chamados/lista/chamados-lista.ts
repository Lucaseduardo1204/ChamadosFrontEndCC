import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  ChamadoResponse,
  PRIORIDADES,
  PRIORIDADE_LABEL,
  SITUACAO_LABEL,
  SITUACOES,
  TIPOS,
  TIPO_LABEL,
} from '../../models/chamado.model';
import { mensagemErro } from '../../services/api';
import { ChamadoService } from '../../services/chamado.service';
import { ToastService } from '../../services/toast.service';
import { Paginacao, paginar } from '../../shared/paginacao/paginacao';
import { OpcaoSelecao, SelecaoMultipla } from '../../shared/selecao-multipla/selecao-multipla';
import {
  FILTROS_VAZIOS,
  FiltrosChamado,
  SEM_RESPONSAVEL,
  filtrarChamados,
  filtrosDaUrl,
  filtrosParaUrl,
  lotacoesDistintas,
  responsaveisDistintos,
  temFiltro,
} from '../filtros';

@Component({
  selector: 'app-chamados-lista',
  imports: [DatePipe, RouterLink, Paginacao, SelecaoMultipla],
  templateUrl: './chamados-lista.html',
  styleUrl: './chamados-lista.css',
})
export class ChamadosLista implements OnInit {
  private readonly chamadoService = inject(ChamadoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly situacaoLabel = SITUACAO_LABEL;
  protected readonly prioridadeLabel = PRIORIDADE_LABEL;
  protected readonly tipoLabel = TIPO_LABEL;

  protected readonly opcoesSituacao: OpcaoSelecao[] = SITUACOES.map((s) => ({
    valor: s,
    rotulo: SITUACAO_LABEL[s],
  }));
  protected readonly opcoesPrioridade: OpcaoSelecao[] = PRIORIDADES.map((p) => ({
    valor: p,
    rotulo: PRIORIDADE_LABEL[p],
  }));
  protected readonly opcoesTipo: OpcaoSelecao[] = TIPOS.map((t) => ({
    valor: t,
    rotulo: TIPO_LABEL[t],
  }));

  protected readonly chamados = signal<ChamadoResponse[]>([]);
  protected readonly carregando = signal(true);
  protected readonly exportando = signal(false);

  /** A URL é a fonte dos filtros: o dashboard abre a lista já filtrada por query params. */
  protected readonly filtros = toSignal(this.route.queryParams.pipe(map(filtrosDaUrl)), {
    initialValue: FILTROS_VAZIOS,
  });
  protected readonly filtrando = computed(() => temFiltro(this.filtros()));

  /** Lotação e responsável vêm dos próprios chamados (não são listas fixas). */
  protected readonly opcoesLotacao = computed<OpcaoSelecao[]>(() =>
    lotacoesDistintas(this.chamados()).map((l) => ({ valor: l, rotulo: l })),
  );
  protected readonly opcoesResponsavel = computed<OpcaoSelecao[]>(() => [
    { valor: SEM_RESPONSAVEL, rotulo: 'Sem responsável' },
    ...responsaveisDistintos(this.chamados()).map((r) => ({ valor: String(r.id), rotulo: r.nome })),
  ]);

  protected readonly chamadosFiltrados = computed(() =>
    filtrarChamados(this.chamados(), this.filtros()),
  );

  /** Ids marcados; a seleção sobrevive à troca de página e de filtros. */
  protected readonly selecionados = signal<ReadonlySet<number>>(new Set());
  protected readonly quantidadeSelecionada = computed(() => this.selecionados().size);
  /** Estado do checkbox do cabeçalho, que vale para todos os resultados do filtro (todas as páginas). */
  protected readonly filtradosSelecionados = computed(() => {
    const filtrados = this.chamadosFiltrados();
    const marcados = filtrados.filter((c) => this.selecionados().has(c.id)).length;
    return { todos: marcados > 0 && marcados === filtrados.length, alguns: marcados > 0 };
  });

  /** Volta para a primeira aba sempre que um filtro muda. */
  protected readonly pagina = linkedSignal({ source: this.filtros, computation: () => 1 });
  protected readonly chamadosDaPagina = computed(() =>
    paginar(this.chamadosFiltrados(), this.pagina()),
  );
  ngOnInit(): void {
    this.chamadoService.listar().subscribe({
      next: (chamados) => {
        this.chamados.set(chamados);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.toast.erro(mensagemErro(err, 'Erro ao carregar os chamados.'));
        this.carregando.set(false);
      },
    });
  }

  protected filtrar(campo: keyof FiltrosChamado, valor: string | string[]): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: filtrosParaUrl({ [campo]: valor } as Partial<FiltrosChamado>),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected limparFiltros(): void {
    this.router.navigate([], { relativeTo: this.route, replaceUrl: true });
  }

  protected abrir(chamado: ChamadoResponse): void {
    this.router.navigate(['/chamados', chamado.id]);
  }

  protected alternarSelecao(chamado: ChamadoResponse, marcado: boolean): void {
    this.selecionar([chamado], marcado);
  }

  /** O checkbox do cabeçalho marca/desmarca todos os resultados do filtro, não só a página atual. */
  protected alternarFiltrados(marcado: boolean): void {
    this.selecionar(this.chamadosFiltrados(), marcado);
  }

  protected limparSelecao(): void {
    this.selecionados.set(new Set());
  }

  private selecionar(chamados: ChamadoResponse[], marcado: boolean): void {
    const ids = new Set(this.selecionados());
    for (const chamado of chamados) {
      if (marcado) {
        ids.add(chamado.id);
      } else {
        ids.delete(chamado.id);
      }
    }
    this.selecionados.set(ids);
  }

  /** O que o botão exporta: os marcados; sem marcação, os resultados do filtro; sem filtro, todos. */
  protected readonly exportacao = computed(() => {
    if (this.quantidadeSelecionada() > 0) {
      return { modo: 'selecionados' as const, quantidade: this.quantidadeSelecionada() };
    }
    if (this.filtrando()) {
      return { modo: 'filtrados' as const, quantidade: this.chamadosFiltrados().length };
    }
    return { modo: 'todos' as const, quantidade: this.chamados().length };
  });

  protected exportar(): void {
    const { modo } = this.exportacao();
    const requisicao =
      modo === 'todos'
        ? this.chamadoService.exportar()
        : this.chamadoService.exportarSelecionados(
            modo === 'selecionados'
              ? [...this.selecionados()]
              : this.chamadosFiltrados().map((c) => c.id),
          );

    this.exportando.set(true);
    requisicao.subscribe({
      next: (arquivo) => {
        const url = URL.createObjectURL(arquivo);
        const link = document.createElement('a');
        link.href = url;
        const hoje = new Date();
        const data = [
          hoje.getFullYear(),
          String(hoje.getMonth() + 1).padStart(2, '0'),
          String(hoje.getDate()).padStart(2, '0'),
        ].join('-');
        link.download = `chamados-${data}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
        this.exportando.set(false);
      },
      error: () => {
        this.toast.erro('Erro ao exportar os chamados.');
        this.exportando.set(false);
      },
    });
  }
}
