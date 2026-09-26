import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  FUNDACOES,
  Fundacao,
  LIMITES_USUARIO,
  TIPOS_USUARIO,
  TIPO_USUARIO_LABEL,
  TipoUsuario,
  Usuario,
  UsuarioAtualizacao,
} from '../../models/usuario.model';
import { errosDeCampo, mensagemErro } from '../../services/api';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UsuarioService } from '../../services/usuario.service';
import {
  aplicarErrosDoServidor,
  igualAo,
  marcarErroDoServidor,
  mensagemDoCampo,
} from '../../shared/form-erros';

type CampoUsuario = 'nome' | 'email' | 'tipoUsuario' | 'fundacao' | 'senha' | 'confirmarSenha';
type CampoSenha = 'senha' | 'confirmarSenha';

const validadoresSenha = [
  Validators.required,
  Validators.minLength(LIMITES_USUARIO.senhaMin),
  Validators.maxLength(LIMITES_USUARIO.senhaMax),
];

/** Cria (`/usuarios/novo`) ou edita (`/usuarios/:id`) um usuário. */
@Component({
  selector: 'app-usuario-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css',
})
export class UsuarioForm implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Parâmetro de rota `:id`; ausente na criação. */
  readonly id = input<string>();

  protected readonly edicao = computed(() => this.id() !== undefined);
  protected readonly fundacoes = FUNDACOES;
  protected readonly tiposUsuario = TIPOS_USUARIO;
  protected readonly tipoLabel = TIPO_USUARIO_LABEL;
  protected readonly limites = LIMITES_USUARIO;

  protected readonly usuario = signal<Usuario | null>(null);
  protected readonly meuId = signal<number | null>(null);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly salvandoSenha = signal(false);
  protected readonly alterandoAtivo = signal(false);

  protected readonly ehVoce = computed(() => this.usuario()?.id === this.meuId());

  protected readonly form = this.fb.group({
    nome: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(LIMITES_USUARIO.nome)],
    ],
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(LIMITES_USUARIO.email)],
    ],
    tipoUsuario: ['' as TipoUsuario | '', Validators.required],
    fundacao: ['' as Fundacao | '', Validators.required],
    // Só usados na criação; na edição a senha é trocada no cartão próprio.
    senha: ['', validadoresSenha],
    confirmarSenha: ['', [Validators.required, igualAo('senha')]],
  });

  protected readonly formSenha = this.fb.group({
    senha: ['', validadoresSenha],
    confirmarSenha: ['', [Validators.required, igualAo('senha')]],
  });

  ngOnInit(): void {
    if (!this.edicao()) {
      return;
    }
    this.form.controls.senha.disable();
    this.form.controls.confirmarSenha.disable();

    this.carregando.set(true);
    forkJoin({
      usuario: this.usuarioService.buscar(Number(this.id())),
      eu: this.usuarioService.eu(),
    }).subscribe({
      next: ({ usuario, eu }) => {
        this.usuario.set(usuario);
        this.meuId.set(eu.id);
        this.form.patchValue(usuario);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.toast.erro(mensagemErro(err, 'Erro ao carregar o usuário.'));
        this.carregando.set(false);
      },
    });
  }

  protected invalido(controle: CampoUsuario): boolean {
    const c = this.form.controls[controle];
    return c.invalid && c.touched;
  }

  protected senhaInvalida(controle: CampoSenha): boolean {
    const c = this.formSenha.controls[controle];
    return c.invalid && c.touched;
  }

  protected mensagem(controle: CampoUsuario): string {
    return mensagemDoCampo(this.form.controls[controle]);
  }

  protected mensagemSenha(controle: CampoSenha): string {
    return mensagemDoCampo(this.formSenha.controls[controle]);
  }

  protected salvar(): void {
    // A confirmação depende do outro campo: revalida caso a senha tenha mudado depois.
    this.form.controls.confirmarSenha.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nome, email, tipoUsuario, fundacao, senha } = this.form.getRawValue();
    const dados = {
      nome: nome.trim(),
      email: email.trim(),
      tipoUsuario,
      fundacao,
    } as UsuarioAtualizacao;
    const usuario = this.usuario();

    this.salvando.set(true);
    const requisicao = usuario
      ? this.usuarioService.atualizar(usuario.id, dados)
      : this.usuarioService.criar({ ...dados, senha });

    requisicao.subscribe({
      next: (salvo) => {
        // O token é emitido para o e-mail: quem troca o próprio e-mail precisa entrar de novo.
        if (this.ehVoce() && usuario && salvo.email !== usuario.email) {
          this.toast.sucesso('E-mail alterado. Entre novamente com o novo e-mail.');
          this.auth.logout();
          return;
        }
        this.toast.sucesso(usuario ? 'Usuário atualizado.' : `Usuário ${salvo.nome} criado.`);
        this.router.navigate(['/usuarios']);
      },
      error: (err: unknown) => {
        this.salvando.set(false);
        // E-mail repetido chega como 409 { erro }: destaca o próprio campo.
        if (err instanceof HttpErrorResponse && err.status === 409) {
          marcarErroDoServidor(
            this.form.controls.email,
            mensagemErro(err, 'E-mail já cadastrado.'),
          );
          return;
        }
        const destacou = aplicarErrosDoServidor(this.form, errosDeCampo(err));
        this.toast.erro(
          destacou
            ? 'Verifique os campos destacados.'
            : mensagemErro(err, 'Erro ao salvar o usuário.'),
        );
      },
    });
  }

  protected salvarSenha(): void {
    const usuario = this.usuario();
    this.formSenha.controls.confirmarSenha.updateValueAndValidity();
    if (!usuario || this.formSenha.invalid) {
      this.formSenha.markAllAsTouched();
      return;
    }

    this.salvandoSenha.set(true);
    this.usuarioService.alterarSenha(usuario.id, this.formSenha.getRawValue().senha).subscribe({
      next: () => {
        this.toast.sucesso('Senha alterada.');
        this.formSenha.reset();
        this.salvandoSenha.set(false);
      },
      error: (err: unknown) => {
        this.salvandoSenha.set(false);
        const destacou = aplicarErrosDoServidor(this.formSenha, errosDeCampo(err));
        this.toast.erro(
          destacou
            ? 'Verifique os campos destacados.'
            : mensagemErro(err, 'Erro ao alterar a senha.'),
        );
      },
    });
  }

  protected alterarAtivo(): void {
    const usuario = this.usuario();
    if (!usuario) {
      return;
    }

    this.alterandoAtivo.set(true);
    this.usuarioService.alterarAtivo(usuario.id, !usuario.ativo).subscribe({
      next: (atualizado) => {
        this.usuario.set(atualizado);
        this.toast.sucesso(atualizado.ativo ? 'Usuário ativado.' : 'Usuário desativado.');
        this.alterandoAtivo.set(false);
      },
      error: (err: unknown) => {
        this.toast.erro(mensagemErro(err, 'Erro ao alterar o usuário.'));
        this.alterandoAtivo.set(false);
      },
    });
  }
}
