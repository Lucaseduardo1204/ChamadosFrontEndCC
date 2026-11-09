import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AlterarSituacaoLs,
  ChamadoLsResponse,
  LIMITES_LS,
  SITUACAO_LS_LABEL,
} from '../../models/chamado-ls.model';
import { errosDeCampo, mensagemErro } from '../../services/api';
import { ChamadoLsService } from '../../services/chamado-ls.service';
import { ToastService } from '../../services/toast.service';
import { aplicarErrosDoServidor, mensagemDoCampo } from '../../shared/form-erros';

/**
 * Chamados abertos no LS (intranet) para este chamado: o que está em análise, o histórico
 * e o formulário para registrar um novo. Só um fica em análise por vez.
 */
@Component({
  selector: 'app-secao-ls',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './secao-ls.html',
  styleUrl: './secao-ls.css',
})
export class SecaoLs implements OnInit {
  private readonly chamadoLsService = inject(ChamadoLsService);
  private readonly toast = inject(ToastService);

  readonly chamadoId = input.required<number>();
  /** Chamado FECHADA não pode ser enviado ao LS. */
  readonly fechado = input(false);

  protected readonly situacaoLabel = SITUACAO_LS_LABEL;
  protected readonly limites = LIMITES_LS;

  protected readonly registros = signal<ChamadoLsResponse[]>([]);
  protected readonly carregando = signal(true);
  protected readonly processando = signal(false);

  protected readonly emAnalise = computed(
    () => this.registros().find((ls) => ls.situacao === 'EM_ANALISE') ?? null,
  );
  protected readonly historico = computed(() =>
    this.registros().filter((ls) => ls.situacao !== 'EM_ANALISE'),
  );

  protected readonly form = inject(NonNullableFormBuilder).group({
    numeroLs: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(LIMITES_LS.numeroLs)],
    ],
    observacao: ['', Validators.maxLength(LIMITES_LS.observacao)],
  });

  /** Retorno do desenvolvimento, gravado ao concluir ou cancelar. */
  protected readonly retornoCtrl = new FormControl('', {
    nonNullable: true,
    validators: Validators.maxLength(LIMITES_LS.observacao),
  });

  ngOnInit(): void {
    this.chamadoLsService.listarDoChamado(this.chamadoId()).subscribe({
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

  protected invalido(campo: 'numeroLs' | 'observacao'): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && controle.touched;
  }

  protected mensagemCampo(campo: 'numeroLs' | 'observacao'): string {
    return mensagemDoCampo(this.form.controls[campo]);
  }

  protected abrir(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { numeroLs, observacao } = this.form.getRawValue();

    this.processando.set(true);
    this.chamadoLsService
      .abrir(this.chamadoId(), { numeroLs: numeroLs.trim(), observacao: observacao.trim() || null })
      .subscribe({
        next: (novo) => {
          this.registros.update((lista) => [novo, ...lista]);
          this.form.reset();
          this.toast.sucesso(`Chamado ${novo.numeroLs} do LS registrado.`);
          this.processando.set(false);
        },
        error: (err: unknown) => {
          const destacou = aplicarErrosDoServidor(this.form, errosDeCampo(err));
          this.toast.erro(
            destacou
              ? 'Verifique os campos destacados.'
              : mensagemErro(err, 'Erro ao registrar o chamado do LS.'),
          );
          this.processando.set(false);
        },
      });
  }

  protected finalizar(situacao: AlterarSituacaoLs['situacao']): void {
    const ls = this.emAnalise();
    if (!ls || this.retornoCtrl.invalid) {
      return;
    }

    this.processando.set(true);
    this.chamadoLsService
      .alterarSituacao(ls.id, { situacao, observacao: this.retornoCtrl.value.trim() || null })
      .subscribe({
        next: (atualizado) => {
          this.registros.update((lista) =>
            lista.map((item) => (item.id === atualizado.id ? atualizado : item)),
          );
          this.retornoCtrl.reset();
          this.toast.sucesso(
            `Chamado ${atualizado.numeroLs} do LS ${situacao === 'CONCLUIDO' ? 'concluído' : 'cancelado'}.`,
          );
          this.processando.set(false);
        },
        error: (err: unknown) => {
          this.toast.erro(mensagemErro(err, 'Erro ao atualizar o chamado do LS.'));
          this.processando.set(false);
        },
      });
  }
}
