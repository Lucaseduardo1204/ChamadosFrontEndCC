import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ChamadoResponse,
  PRIORIDADE_LABEL,
  SITUACAO_LABEL,
  SITUACOES,
  Situacao,
  TIPO_LABEL,
} from '../../models/chamado.model';
import { InteracaoResponse, LIMITE_INTERACAO } from '../../models/interacao.model';
import { Usuario } from '../../models/usuario.model';
import { mensagemErro } from '../../services/api';
import { ChamadoService } from '../../services/chamado.service';
import { ToastService } from '../../services/toast.service';
import { UsuarioService } from '../../services/usuario.service';
import { SecaoLs } from './secao-ls';

@Component({
  selector: 'app-chamado-detalhe',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, SecaoLs],
  templateUrl: './chamado-detalhe.html',
  styleUrl: './chamado-detalhe.css',
})
export class ChamadoDetalhe implements OnInit {
  private readonly chamadoService = inject(ChamadoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Parâmetro de rota `:id`, ligado via `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  protected readonly situacaoLabel = SITUACAO_LABEL;
  protected readonly prioridadeLabel = PRIORIDADE_LABEL;
  protected readonly tipoLabel = TIPO_LABEL;
  protected readonly limiteInteracao = LIMITE_INTERACAO;

  protected readonly chamado = signal<ChamadoResponse | null>(null);
  protected readonly interacoes = signal<InteracaoResponse[]>([]);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly carregando = signal(true);
  protected readonly processando = signal(false);
  protected readonly confirmandoInativacao = signal(false);

  protected readonly responsavelCtrl = new FormControl<number | null>(null, Validators.required);
  protected readonly situacaoCtrl = new FormControl<Situacao | null>(null, Validators.required);
  protected readonly comentarioCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(LIMITE_INTERACAO)],
  });

  // Cada <form> precisa de um [formGroup]: sem ele o ReactiveFormsModule não assume o formulário,
  // o (ngSubmit) nunca dispara e o navegador faz o submit nativo (recarregando a página).
  protected readonly responsavelForm = new FormGroup({ responsavel: this.responsavelCtrl });
  protected readonly situacaoForm = new FormGroup({ situacao: this.situacaoCtrl });
  protected readonly comentarioForm = new FormGroup({ texto: this.comentarioCtrl });

  /** Só analistas ativos podem ser responsáveis. */
  protected readonly analistas = computed(() =>
    this.usuarios().filter((u) => u.tipoUsuario === 'ANALISTA' && u.ativo),
  );

  protected readonly fechado = computed(() => this.chamado()?.situacao === 'FECHADA');

  protected readonly situacoesPermitidas = computed(() =>
    SITUACOES.filter((s) => s !== this.chamado()?.situacao),
  );

  protected readonly interacoesOrdenadas = computed(() =>
    [...this.interacoes()].sort((a, b) => a.dataHora.localeCompare(b.dataHora)),
  );

  ngOnInit(): void {
    const id = Number(this.id());
    forkJoin({
      chamado: this.chamadoService.buscar(id),
      interacoes: this.chamadoService.listarInteracoes(id),
      usuarios: this.usuarioService.listar(),
    }).subscribe({
      next: ({ chamado, interacoes, usuarios }) => {
        this.atualizarChamado(chamado);
        this.interacoes.set(interacoes);
        this.usuarios.set(usuarios);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.toast.erro(mensagemErro(err, 'Erro ao carregar o chamado.'));
        this.carregando.set(false);
      },
    });
  }

  protected atribuirResponsavel(): void {
    const chamado = this.chamado();
    const responsavelId = this.responsavelCtrl.value;
    if (!chamado || responsavelId === null) {
      return;
    }

    this.processando.set(true);
    this.chamadoService.alterarResponsavel(chamado.id, responsavelId).subscribe({
      next: (atualizado) => {
        this.atualizarChamado(atualizado);
        this.toast.sucesso('Responsável atribuído.');
        this.processando.set(false);
      },
      error: (err: unknown) => this.falhar(err, 'Erro ao atribuir o responsável.'),
    });
  }

  protected alterarSituacao(): void {
    const chamado = this.chamado();
    const situacao = this.situacaoCtrl.value;
    if (!chamado || situacao === null) {
      return;
    }

    this.processando.set(true);
    this.chamadoService.alterarSituacao(chamado.id, situacao).subscribe({
      next: (atualizado) => {
        this.atualizarChamado(atualizado);
        this.toast.sucesso('Situação alterada.');
        this.processando.set(false);
      },
      error: (err: unknown) => this.falhar(err, 'Erro ao alterar a situação.'),
    });
  }

  protected comentar(): void {
    const chamado = this.chamado();
    const texto = this.comentarioCtrl.value.trim();
    if (!chamado || !texto) {
      this.comentarioCtrl.markAsTouched();
      return;
    }

    this.processando.set(true);
    this.chamadoService.comentar(chamado.id, texto).subscribe({
      next: (interacao) => {
        this.interacoes.update((lista) => [...lista, interacao]);
        this.comentarioCtrl.reset();
        this.processando.set(false);
      },
      error: (err: unknown) => this.falhar(err, 'Erro ao registrar a interação.'),
    });
  }

  protected inativar(): void {
    const chamado = this.chamado();
    if (!chamado) {
      return;
    }

    this.processando.set(true);
    this.chamadoService.inativar(chamado.id).subscribe({
      next: () => {
        this.toast.sucesso('Chamado inativado.');
        this.router.navigate(['/chamados']);
      },
      error: (err: unknown) => {
        this.confirmandoInativacao.set(false);
        this.falhar(err, 'Erro ao inativar o chamado.');
      },
    });
  }

  private atualizarChamado(chamado: ChamadoResponse): void {
    this.chamado.set(chamado);
    this.responsavelCtrl.setValue(chamado.responsavel?.id ?? null);
    this.situacaoCtrl.reset(null);
    // FECHADA é estado terminal: a situação não pode mais ser alterada.
    if (chamado.situacao === 'FECHADA') {
      this.situacaoCtrl.disable();
    } else {
      this.situacaoCtrl.enable();
    }
  }

  private falhar(err: unknown, padrao: string): void {
    this.toast.erro(mensagemErro(err, padrao));
    this.processando.set(false);
  }
}
