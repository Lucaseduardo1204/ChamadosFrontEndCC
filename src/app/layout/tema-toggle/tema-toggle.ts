import { Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-tema-toggle',
  template: `
    <button
      type="button"
      [attr.aria-label]="rotulo()"
      [title]="rotulo()"
      (click)="theme.alternar()"
    >
      <span aria-hidden="true">{{ theme.tema() === 'escuro' ? '☀' : '☾' }}</span>
    </button>
  `,
  styles: `
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border: 1px solid var(--cor-borda);
      border-radius: var(--raio);
      background: var(--cor-superficie);
      color: var(--cor-texto);
      font-size: 1.05rem;
      cursor: pointer;
    }

    button:hover {
      background: var(--cor-fundo);
    }
  `,
})
export class TemaToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly rotulo = computed(() =>
    this.theme.tema() === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro',
  );
}
