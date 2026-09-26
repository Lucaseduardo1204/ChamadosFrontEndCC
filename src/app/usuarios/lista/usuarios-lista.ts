import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TIPO_USUARIO_LABEL, Usuario } from '../../models/usuario.model';
import { mensagemErro } from '../../services/api';
import { ToastService } from '../../services/toast.service';
import { UsuarioService } from '../../services/usuario.service';

type FiltroSituacao = 'todos' | 'ativos' | 'inativos';

@Component({
  selector: 'app-usuarios-lista',
  imports: [RouterLink],
  templateUrl: './usuarios-lista.html',
  styleUrl: './usuarios-lista.css',
})
export class UsuariosLista implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);

  protected readonly tipoLabel = TIPO_USUARIO_LABEL;

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly meuId = signal<number | null>(null);
  protected readonly carregando = signal(true);
  /** Id do usuário cuja ativação está sendo alterada (desabilita só o botão dele). */
  protected readonly alterandoId = signal<number | null>(null);
  protected readonly busca = signal('');
  protected readonly filtro = signal<FiltroSituacao>('todos');

  protected readonly usuariosFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const filtro = this.filtro();
    return this.usuarios().filter(
      (u) =>
        (filtro === 'todos' || (filtro === 'ativos') === u.ativo) &&
        (!termo || [u.nome, u.email].some((valor) => valor.toLowerCase().includes(termo))),
    );
  });

  ngOnInit(): void {
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.toast.erro(mensagemErro(err, 'Erro ao carregar os usuários.'));
        this.carregando.set(false);
      },
    });
    // Usado só para não oferecer "Desativar" no próprio usuário; o backend também recusa.
    this.usuarioService.eu().subscribe({ next: (eu) => this.meuId.set(eu.id), error: () => {} });
  }

  protected alterarAtivo(usuario: Usuario): void {
    this.alterandoId.set(usuario.id);
    this.usuarioService.alterarAtivo(usuario.id, !usuario.ativo).subscribe({
      next: (atualizado) => {
        this.usuarios.update((lista) =>
          lista.map((u) => (u.id === atualizado.id ? atualizado : u)),
        );
        this.toast.sucesso(
          atualizado.ativo
            ? `${atualizado.nome} foi ativado.`
            : `${atualizado.nome} foi desativado.`,
        );
        this.alterandoId.set(null);
      },
      error: (err: unknown) => {
        this.toast.erro(mensagemErro(err, 'Erro ao alterar o usuário.'));
        this.alterandoId.set(null);
      },
    });
  }

  protected alterarFiltro(valor: string): void {
    this.filtro.set(valor as FiltroSituacao);
  }
}
