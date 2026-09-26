import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  tipo: 'sucesso' | 'erro';
  mensagem: string;
}

const DURACAO_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private proximoId = 0;
  private readonly lista = signal<Toast[]>([]);
  readonly toasts = this.lista.asReadonly();

  sucesso(mensagem: string): void {
    this.adicionar('sucesso', mensagem);
  }

  erro(mensagem: string): void {
    this.adicionar('erro', mensagem);
  }

  remover(id: number): void {
    this.lista.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private adicionar(tipo: Toast['tipo'], mensagem: string): void {
    const id = ++this.proximoId;
    this.lista.update((toasts) => [...toasts, { id, tipo, mensagem }]);
    setTimeout(() => this.remover(id), DURACAO_MS);
  }
}
