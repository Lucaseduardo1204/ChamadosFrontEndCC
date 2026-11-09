import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import {
  ChamadoLsResponse,
  SITUACAO_LS_LABEL,
  SITUACOES_LS,
  SituacaoLs,
} from '../models/chamado-ls.model';
import { mensagemErro } from '../services/api';
import { ChamadoLsService } from '../services/chamado-ls.service';
import { ToastService } from '../services/toast.service';
import { Paginacao, paginar } from '../shared/paginacao/paginacao';

/** Valor de `?situacao=` para ver todas; sem o parâmetro, a tela mostra só as em análise. */
const TODAS = 'todas';

interface FiltrosLs {
  situacao: SituacaoLs | typeof TODAS;
  busca: string;
}

function filtrosDaUrl(params: Record<string, unknown>): FiltrosLs {
  const situacao = params['situacao'];
  return {
    situacao:
      situacao === TODAS || SITUACOES_LS.includes(situacao as SituacaoLs)
        ? (situacao as FiltrosLs['situacao'])
        : 'EM_ANALISE',
    busca: typeof params['busca'] === 'string' ? params['busca'] : '',
  };
}

export function filtrarLs(lista: ChamadoLsResponse[], f: FiltrosLs): ChamadoLsResponse[] {
  const termo = f.busca.trim().toLowerCase();
  return lista.filter(
    (ls) =>
      (f.situacao === TODAS || ls.situacao === f.situacao) &&
      (!termo ||
        [ls.numeroLs, ls.chamado?.codigoChamado, ls.resumo].some((v) =>
          v?.toLowerCase().includes(termo),
        )),
  );
}

@Component({
  selector: 'app-chamados-ls-lista',
  imports: [DatePipe, RouterLink, Paginacao],
  templateUrl: './chamados-ls-lista.html',
  styleUrl: './chamados-ls-lista.css',
})
export class ChamadosLsLista implements OnInit {
  private readonly chamadoLsService = inject(ChamadoLsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly situacoes = SITUACOES_LS;
  protected readonly situacaoLabel = SITUACAO_LS_LABEL;
  protected readonly todas = TODAS;

  protected readonly registros = signal<ChamadoLsResponse[]>([]);
  protected readonly carregando = signal(true);

  protected readonly filtros = toSignal(this.route.queryParams.pipe(map(filtrosDaUrl)), {
    initialValue: filtrosDaUrl({}),
  });

  protected readonly filtrados = computed(() => filtrarLs(this.registros(), this.filtros()));

  /** Quantos em cada situação, para os rótulos do filtro. */
  protected readonly contagem = computed(() => {
    const porSituacao: Record<string, number> = { [TODAS]: this.registros().length };
    for (const ls of this.registros()) {
      porSituacao[ls.situacao] = (porSituacao[ls.situacao] ?? 0) + 1;
    }
    return porSituacao;
  });

  protected readonly pagina = linkedSignal({ source: this.filtros, computation: () => 1 });
  protected readonly daPagina = computed(() => paginar(this.filtrados(), this.pagina()));

  ngOnInit(): void {
    this.chamadoLsService.listar().subscribe({
      next: (registros) => {
        this.registros.set(registros);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.toast.erro(mensagemErro(err, 'Erro ao carregar os chamados do LS.'));
        this.carregando.set(false);
      },
    });
  }

  protected filtrar(campo: keyof FiltrosLs, valor: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      // EM_ANALISE é o padrão: fica fora da URL
      queryParams: { [campo]: valor && valor !== 'EM_ANALISE' ? valor : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Só os relacionados a um chamado deste sistema abrem algo ao clicar. */
  protected abrir(ls: ChamadoLsResponse): void {
    if (ls.chamado) {
      this.router.navigate(['/chamados', ls.chamado.id]);
    }
  }
}
