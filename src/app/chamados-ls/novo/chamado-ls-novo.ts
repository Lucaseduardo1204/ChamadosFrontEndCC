import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ChamadoLsResponse, LIMITES_LS } from '../../models/chamado-ls.model';
import { ChamadoResponse } from '../../models/chamado.model';
import { errosDeCampo, mensagemErro } from '../../services/api';
import { ChamadoLsService } from '../../services/chamado-ls.service';
import { ChamadoService } from '../../services/chamado.service';
import { ToastService } from '../../services/toast.service';
import { aplicarErrosDoServidor, mensagemDoCampo } from '../../shared/form-erros';

type Campo = 'codigoChamado' | 'numeroLs' | 'resumo' | 'lotacao' | 'observacao';

/** Por que um chamado não pode ir para o LS agora (`null` = pode). Mesmas regras do backend. */
export function motivoInelegivel(
  chamado: ChamadoResponse | undefined,
  registrosLs: ChamadoLsResponse[],
): string | null {
  if (!chamado) {
    return 'Chamado não encontrado.';
  }
  if (chamado.situacao === 'FECHADA') {
    return 'Chamado fechado não pode ser enviado ao LS.';
  }
  const emAnalise = registrosLs.find(
    (ls) => ls.chamado?.id === chamado.id && ls.situacao === 'EM_ANALISE',
  );
  return emAnalise ? `Este chamado já está em análise no LS (${emAnalise.numeroLs}).` : null;
}

/**
 * Registra um chamado aberto no LS. O chamado deste sistema é opcional: sem ele, resumo é obrigatório;
 * com ele, resumo e lotação em branco são copiados do chamado pelo backend.
 */
@Component({
  selector: 'app-chamado-ls-novo',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './chamado-ls-novo.html',
  styleUrl: './chamado-ls-novo.css',
})
export class ChamadoLsNovo implements OnInit {
  private readonly chamadoService = inject(ChamadoService);
  private readonly chamadoLsService = inject(ChamadoLsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly limites = LIMITES_LS;

  protected readonly chamados = signal<ChamadoResponse[]>([]);
  private readonly registrosLs = signal<ChamadoLsResponse[]>([]);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);

  private readonly porCodigo = computed(
    () => new Map(this.chamados().map((c) => [c.codigoChamado.toLowerCase(), c])),
  );

  /** Sugestões do campo: só os chamados que podem ir para o LS. */
  protected readonly elegiveis = computed(() =>
    this.chamados().filter((c) => motivoInelegivel(c, this.registrosLs()) === null),
  );

  protected readonly form = inject(NonNullableFormBuilder).group({
    codigoChamado: ['', (c: AbstractControl) => this.validarChamado(c)],
    numeroLs: [
      '',
      [Validators.required, Validators.pattern(/\S/), Validators.maxLength(LIMITES_LS.numeroLs)],
    ],
    resumo: [
      '',
      [Validators.maxLength(LIMITES_LS.resumo), (c: AbstractControl) => this.validarResumo(c)],
    ],
    lotacao: ['', Validators.maxLength(LIMITES_LS.lotacao)],
    observacao: ['', Validators.maxLength(LIMITES_LS.observacao)],
  });

  /** Chamado escolhido, para mostrar o resumo embaixo do campo. */
  protected readonly selecionado = signal<ChamadoResponse | null>(null);

  ngOnInit(): void {
    forkJoin({
      chamados: this.chamadoService.listar(),
      registrosLs: this.chamadoLsService.listar(),
    }).subscribe({
      next: ({ chamados, registrosLs }) => {
        this.chamados.set(chamados);
        this.registrosLs.set(registrosLs);
        this.carregando.set(false);
        // O validador depende dos dados que acabaram de chegar
        this.form.controls.codigoChamado.updateValueAndValidity();
      },
      error: (err: unknown) => {
        this.toast.erro(mensagemErro(err, 'Erro ao carregar os chamados.'));
        this.carregando.set(false);
      },
    });

    this.form.controls.codigoChamado.valueChanges.subscribe((codigo) => {
      this.selecionado.set(this.buscar(codigo) ?? null);
      // O resumo só é obrigatório sem chamado relacionado
      this.form.controls.resumo.updateValueAndValidity();
    });
  }

  private buscar(codigo: string): ChamadoResponse | undefined {
    return this.porCodigo().get(codigo.trim().toLowerCase());
  }

  private validarChamado(controle: AbstractControl): ValidationErrors | null {
    const codigo = String(controle.value ?? '').trim();
    if (!codigo || this.carregando()) {
      return null;
    }
    const motivo = motivoInelegivel(this.buscar(codigo), this.registrosLs());
    return motivo ? { mensagem: motivo } : null;
  }

  private validarResumo(controle: AbstractControl): ValidationErrors | null {
    const semChamado = !this.form?.controls.codigoChamado.value.trim();
    return semChamado && !String(controle.value ?? '').trim()
      ? { mensagem: 'Informe o resumo (obrigatório sem chamado relacionado).' }
      : null;
  }

  protected invalido(campo: Campo): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && controle.touched;
  }

  protected mensagemCampo(campo: Campo): string {
    return mensagemDoCampo(this.form.controls[campo]);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { codigoChamado, numeroLs, resumo, lotacao, observacao } = this.form.getRawValue();
    // O validador já garante que um código preenchido existe
    const chamado = codigoChamado.trim() ? this.buscar(codigoChamado) : undefined;

    this.salvando.set(true);
    this.chamadoLsService
      .criar({
        numeroLs: numeroLs.trim(),
        resumo: resumo.trim() || null,
        lotacao: lotacao.trim() || null,
        observacao: observacao.trim() || null,
        chamadoId: chamado?.id ?? null,
      })
      .subscribe({
        next: (novo) => {
          this.toast.sucesso(
            chamado
              ? `Chamado ${novo.numeroLs} do LS registrado para ${chamado.codigoChamado}.`
              : `Chamado ${novo.numeroLs} do LS registrado.`,
          );
          this.router.navigate(['/chamados-ls']);
        },
        error: (err: unknown) => {
          const destacou = aplicarErrosDoServidor(this.form, errosDeCampo(err));
          this.toast.erro(
            destacou
              ? 'Verifique os campos destacados.'
              : mensagemErro(err, 'Erro ao registrar o chamado do LS.'),
          );
          this.salvando.set(false);
        },
      });
  }
}
