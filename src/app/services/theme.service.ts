import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type Tema = 'claro' | 'escuro';

// Mesma chave lida pelo script inline do index.html (evita piscar o tema errado no carregamento).
const CHAVE = 'tema';

function lerTemaSalvo(): Tema | null {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo === 'claro' || salvo === 'escuro' ? salvo : null;
  } catch {
    return null;
  }
}

/**
 * Sem escolha salva, segue a preferência do sistema operacional.
 * A escolha explícita vira o atributo `data-tema` no <html>, que o styles.css usa.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly documento = inject(DOCUMENT);
  private readonly midia = this.documento.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');

  private readonly escolhido = signal<Tema | null>(lerTemaSalvo());
  private readonly sistemaEscuro = signal(this.midia?.matches ?? false);

  readonly tema = computed<Tema>(
    () => this.escolhido() ?? (this.sistemaEscuro() ? 'escuro' : 'claro'),
  );

  constructor() {
    this.midia?.addEventListener('change', (e) => this.sistemaEscuro.set(e.matches));

    effect(() => {
      const tema = this.escolhido();
      const raiz = this.documento.documentElement;
      if (tema) {
        raiz.dataset['tema'] = tema;
      } else {
        delete raiz.dataset['tema'];
      }
    });
  }

  alternar(): void {
    const novo: Tema = this.tema() === 'escuro' ? 'claro' : 'escuro';
    this.escolhido.set(novo);
    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      // Armazenamento indisponível: o tema vale só até recarregar a página.
    }
  }
}
