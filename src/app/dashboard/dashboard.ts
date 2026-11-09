import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FiltrosChamado,
  SEM_RESPONSAVEL,
  dataDoChamado,
  filtrarChamados,
  filtrosParaUrl,
  lotacoesDistintas,
  FILTROS_VAZIOS,
} from '../chamados/filtros';
import { ChamadoLsResponse } from '../models/chamado-ls.model';
import { ChamadoResponse } from '../models/chamado.model';
import { mensagemErro } from '../services/api';
import { ChamadoLsService } from '../services/chamado-ls.service';
import { ChamadoService } from '../services/chamado.service';
import { ToastService } from '../services/toast.service';
import {
  Granularidade,
  Ponto,
  abertosPorResponsavel,
  diasAtras,
  emAnaliseNoLs,
  formatarData,
  porLotacao,
  porPrioridade,
  porSistema,
  porSituacao,
  porTipo,
  resumo,
  serieTemporal,
} from './estatisticas';
import { GraficoBarras } from './grafico-barras';

export const PERIODOS = [
  { valor: '7', rotulo: 'Últimos 7 dias', dias: 7 },
  { valor: '30', rotulo: 'Últimos 30 dias', dias: 30 },
  { valor: '90', rotulo: 'Últimos 90 dias', dias: 90 },
  { valor: '365', rotulo: 'Últimos 12 meses', dias: 365 },
  { valor: 'tudo', rotulo: 'Todo o período', dias: null },
] as const;
type Periodo = (typeof PERIODOS)[number]['valor'];

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, GraficoBarras],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly chamadoService = inject(ChamadoService);
  private readonly chamadoLsService = inject(ChamadoLsService);
  private readonly toast = inject(ToastService);

  protected readonly periodos = PERIODOS;
  protected readonly semResponsavel = SEM_RESPONSAVEL;

  protected readonly chamados = signal<ChamadoResponse[]>([]);
  protected readonly carregando = signal(true);
  /** Registros do LS; `null` se não foi possível carregar (o resto do dashboard segue funcionando). */
  protected readonly registrosLs = signal<ChamadoLsResponse[] | null>(null);
  protected readonly periodo = signal<Periodo>('30');
  protected readonly lotacao = signal('');
  /** Coluna da série sob o mouse/foco; `null` mostra o pico. */
  protected readonly pontoAtivo = signal<Ponto | null>(null);

  private readonly hoje = formatarData(new Date());

  protected readonly lotacoes = computed(() => lotacoesDistintas(this.chamados()));

  /** Intervalo do período escolhido; em "todo o período", do chamado mais antigo até hoje. */
  protected readonly intervalo = computed(() => {
    const dias = PERIODOS.find((p) => p.valor === this.periodo())!.dias;
    if (dias !== null) {
      return { de: diasAtras(new Date(), dias - 1), ate: this.hoje };
    }
    const datas = this.chamados().map(dataDoChamado).sort();
    return { de: datas[0] ?? this.hoje, ate: this.hoje };
  });

  protected readonly granularidade = computed<Granularidade>(() =>
    this.periodo() === '365' || this.periodo() === 'tudo' ? 'mes' : 'dia',
  );

  /** Filtros que os links do dashboard levam para a lista (mesmo recorte que o dashboard mostra). */
  protected readonly filtroBase = computed<Partial<FiltrosChamado>>(() => ({
    ...(this.periodo() === 'tudo' ? {} : this.intervalo()),
    lotacao: this.lotacao() ? [this.lotacao()] : [],
  }));

  protected readonly selecionados = computed(() =>
    filtrarChamados(this.chamados(), { ...FILTROS_VAZIOS, ...this.filtroBase() }),
  );

  protected readonly resumo = computed(() => resumo(this.selecionados()));
  protected readonly emAnaliseNoLs = computed(() => {
    const registros = this.registrosLs();
    return registros === null ? null : emAnaliseNoLs(this.selecionados(), registros);
  });
  protected readonly porSituacao = computed(() => porSituacao(this.selecionados()));
  protected readonly porPrioridade = computed(() => porPrioridade(this.selecionados()));
  protected readonly porTipo = computed(() => porTipo(this.selecionados()));
  protected readonly porLotacao = computed(() => porLotacao(this.selecionados()));
  protected readonly porSistema = computed(() => porSistema(this.selecionados()));
  protected readonly porResponsavel = computed(() => abertosPorResponsavel(this.selecionados()));

  protected readonly serie = computed(() =>
    serieTemporal(
      this.selecionados(),
      this.intervalo().de,
      this.intervalo().ate,
      this.granularidade(),
    ),
  );
  protected readonly maximoSerie = computed(() => Math.max(1, ...this.serie().map((p) => p.valor)));
  protected readonly pico = computed(() =>
    this.serie().reduce<Ponto | null>(
      (maior, p) => (!maior || p.valor > maior.valor ? p : maior),
      null,
    ),
  );

  ngOnInit(): void {
    this.chamadoService.listar().subscribe({
      next: (chamados) => {
        this.chamados.set(chamados);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.toast.erro(mensagemErro(err, 'Erro ao carregar o dashboard.'));
        this.carregando.set(false);
      },
    });
    // Sem toast em caso de erro: o indicador mostra "—" e o resto do dashboard não depende disso
    this.chamadoLsService.listar().subscribe({
      next: (registros) => this.registrosLs.set(registros),
      error: () => this.registrosLs.set(null),
    });
  }

  protected link(filtro: Partial<FiltrosChamado>) {
    return filtrosParaUrl({ ...this.filtroBase(), ...filtro });
  }

  protected alturaColuna(ponto: Ponto): string {
    return ponto.valor ? `max(2px, ${(ponto.valor / this.maximoSerie()) * 100}%)` : '0';
  }

  /** `AAAA-MM-DD` → `Date` local (sem o deslocamento de fuso do `new Date('AAAA-MM-DD')`). */
  protected data(valor: string): Date {
    const [a, m, d] = valor.split('-').map(Number);
    return new Date(a, m - 1, d);
  }
}
