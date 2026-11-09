import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FiltrosChamado, filtrosParaUrl } from '../chamados/filtros';
import { Barra } from './estatisticas';

/**
 * Barras horizontais com rótulo e valor em texto (o valor nunca depende só da cor ou do tamanho).
 * Cada barra com filtro é um link para a lista de chamados já filtrada.
 */
@Component({
  selector: 'app-grafico-barras',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './grafico-barras.html',
  styleUrl: './grafico-barras.css',
})
export class GraficoBarras {
  readonly titulo = input.required<string>();
  readonly barras = input.required<Barra[]>();
  /** Filtros do dashboard (período, lotação) somados ao filtro de cada barra. */
  readonly filtroBase = input<Partial<FiltrosChamado>>({});
  readonly vazio = input('Nenhum chamado no período.');

  protected readonly maximo = computed(() => Math.max(1, ...this.barras().map((b) => b.valor)));
  protected readonly total = computed(() => this.barras().reduce((soma, b) => soma + b.valor, 0));

  protected largura(barra: Barra): string {
    // Valor pequeno ainda aparece (2px); zero fica sem barra.
    return barra.valor ? `max(2px, ${(barra.valor / this.maximo()) * 100}%)` : '0';
  }

  protected percentual(barra: Barra): string {
    return this.total() ? `${Math.round((barra.valor / this.total()) * 100)}%` : '0%';
  }

  protected temLink(barra: Barra): boolean {
    return Object.keys(barra.filtro).length > 0;
  }

  protected queryParams(barra: Barra) {
    return filtrosParaUrl({ ...this.filtroBase(), ...barra.filtro });
  }
}
