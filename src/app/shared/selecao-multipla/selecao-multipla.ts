import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';

export interface OpcaoSelecao {
  valor: string;
  rotulo: string;
}

/**
 * Campo de filtro com várias opções marcáveis (checkboxes numa lista suspensa).
 * Nada marcado = sem filtro (mostra `textoTodos`). Emite a lista inteira a cada mudança,
 * na ordem das opções.
 */
@Component({
  selector: 'app-selecao-multipla',
  templateUrl: './selecao-multipla.html',
  styleUrl: './selecao-multipla.css',
  host: {
    '(document:click)': 'cliqueFora($event)',
    '(keydown.escape)': 'fechar(true)',
  },
})
export class SelecaoMultipla {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly rotulo = input.required<string>();
  readonly opcoes = input.required<readonly OpcaoSelecao[]>();
  readonly selecionados = input<readonly string[]>([]);
  readonly textoTodos = input('Todas');
  readonly alterado = output<string[]>();

  protected readonly aberto = signal(false);
  protected readonly id = `selecao-${proximoId++}`;

  /** "Todas", o rótulo da única opção marcada ou "N selecionadas". */
  protected readonly resumo = computed(() => {
    const marcados = this.opcoes().filter((o) => this.selecionados().includes(o.valor));
    if (marcados.length === 0) return this.textoTodos();
    if (marcados.length <= 2) return marcados.map((o) => o.rotulo).join(', ');
    return `${marcados.length} selecionadas`;
  });

  protected marcado(valor: string): boolean {
    return this.selecionados().includes(valor);
  }

  protected alternar(valor: string, marcar: boolean): void {
    const atuais = new Set(this.selecionados());
    if (marcar) {
      atuais.add(valor);
    } else {
      atuais.delete(valor);
    }
    this.alterado.emit(
      this.opcoes()
        .map((o) => o.valor)
        .filter((v) => atuais.has(v)),
    );
  }

  protected limpar(): void {
    this.alterado.emit([]);
  }

  protected alternarAberto(): void {
    this.aberto.update((a) => !a);
  }

  protected fechar(devolverFoco = false): void {
    if (!this.aberto()) return;
    this.aberto.set(false);
    if (devolverFoco) {
      this.elemento.nativeElement.querySelector<HTMLButtonElement>('.gatilho')?.focus();
    }
  }

  protected cliqueFora(evento: MouseEvent): void {
    if (!this.elemento.nativeElement.contains(evento.target as Node)) this.fechar();
  }
}

let proximoId = 0;
