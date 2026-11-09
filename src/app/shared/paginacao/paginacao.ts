import { Component, computed, input, model } from '@angular/core';

/** Itens por página nas listas. */
export const ITENS_POR_PAGINA = 15;

export function totalDePaginas(total: number, tamanho = ITENS_POR_PAGINA): number {
  return Math.max(1, Math.ceil(total / tamanho));
}

/** Fatia da página (1-based); uma página além do fim cai na última. */
export function paginar<T>(itens: T[], pagina: number, tamanho = ITENS_POR_PAGINA): T[] {
  const atual = Math.min(Math.max(1, pagina), totalDePaginas(itens.length, tamanho));
  return itens.slice((atual - 1) * tamanho, atual * tamanho);
}

/**
 * Abas numeradas mostradas: todas até 9 páginas; acima disso a primeira, a última e as vizinhas
 * da atual, com `null` marcando o salto ("…").
 */
export function abasVisiveis(pagina: number, paginas: number): (number | null)[] {
  if (paginas <= 9) {
    return Array.from({ length: paginas }, (_, i) => i + 1);
  }
  const perto = new Set([1, paginas, pagina - 1, pagina, pagina + 1]);
  const numeros = [...perto].filter((p) => p >= 1 && p <= paginas).sort((a, b) => a - b);
  const abas: (number | null)[] = [];
  numeros.forEach((p, i) => {
    if (i > 0 && p - numeros[i - 1] > 1) abas.push(null);
    abas.push(p);
  });
  return abas;
}

/** Divide uma lista em abas de `ITENS_POR_PAGINA`; some quando tudo cabe numa página. */
@Component({
  selector: 'app-paginacao',
  templateUrl: './paginacao.html',
  styleUrl: './paginacao.css',
})
export class Paginacao {
  readonly total = input.required<number>();
  readonly tamanho = input(ITENS_POR_PAGINA);
  readonly pagina = model(1);

  protected readonly paginas = computed(() => totalDePaginas(this.total(), this.tamanho()));
  /** A página pedida pode ter ficado além do fim (a lista encolheu com um filtro). */
  protected readonly atual = computed(() => Math.min(this.pagina(), this.paginas()));
  protected readonly abas = computed(() => abasVisiveis(this.atual(), this.paginas()));
  protected readonly inicio = computed(() => (this.atual() - 1) * this.tamanho() + 1);
  protected readonly fim = computed(() => Math.min(this.atual() * this.tamanho(), this.total()));

  protected ir(pagina: number): void {
    this.pagina.set(Math.min(Math.max(1, pagina), this.paginas()));
  }
}
