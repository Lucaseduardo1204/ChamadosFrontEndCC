import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ChamadoRequest,
  PRIORIDADES,
  PRIORIDADE_LABEL,
  Prioridade,
  LIMITES_CHAMADO,
  TIPOS,
  TIPO_LABEL,
  TipoChamado,
} from '../../models/chamado.model';
import { errosDeCampo, mensagemErro } from '../../services/api';
import { ChamadoService } from '../../services/chamado.service';
import { ToastService } from '../../services/toast.service';
import { aplicarErrosDoServidor, mensagemDoCampo } from '../../shared/form-erros';

type CampoChamado = keyof ChamadoRequest;

@Component({
  selector: 'app-chamado-novo',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './chamado-novo.html',
  styleUrl: './chamado-novo.css',
})
export class ChamadoNovo {
  private readonly chamadoService = inject(ChamadoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly prioridades = PRIORIDADES;
  protected readonly tipos = TIPOS;
  protected readonly prioridadeLabel = PRIORIDADE_LABEL;
  protected readonly tipoLabel = TIPO_LABEL;
  protected readonly limites = LIMITES_CHAMADO;

  protected readonly salvando = signal(false);

  // A situação não é enviada: o backend cria todo chamado como ABERTA.
  protected readonly form = inject(NonNullableFormBuilder).group({
    codigoChamado: ['', [Validators.required, Validators.maxLength(LIMITES_CHAMADO.codigoChamado)]],
    // Texto livre, como o solicitante; o pattern recusa um valor só com espaços.
    lotacao: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(LIMITES_CHAMADO.lotacao),
      ],
    ],
    prioridade: ['' as Prioridade | '', Validators.required],
    tipo: ['' as TipoChamado | '', Validators.required],
    sistema: ['', [Validators.required, Validators.maxLength(LIMITES_CHAMADO.sistema)]],
    resumo: ['', [Validators.required, Validators.maxLength(LIMITES_CHAMADO.resumo)]],
    descricao: ['', [Validators.required, Validators.maxLength(LIMITES_CHAMADO.descricao)]],
    // Texto livre; o pattern recusa um valor só com espaços.
    solicitante: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(LIMITES_CHAMADO.solicitante),
      ],
    ],
  });

  protected invalido(campo: CampoChamado): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && controle.touched;
  }

  protected mensagemCampo(campo: CampoChamado): string {
    return mensagemDoCampo(this.form.controls[campo]);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue();
    const chamado = {
      ...valor,
      lotacao: valor.lotacao.trim(),
      solicitante: valor.solicitante.trim(),
    } as ChamadoRequest;

    this.salvando.set(true);
    this.chamadoService.criar(chamado).subscribe({
      next: () => {
        this.toast.sucesso('Chamado criado com sucesso.');
        this.router.navigate(['/chamados']);
      },
      error: (err: unknown) => {
        const destacou = aplicarErrosDoServidor(this.form, errosDeCampo(err));
        this.toast.erro(
          destacou
            ? 'Verifique os campos destacados.'
            : mensagemErro(err, 'Erro ao criar o chamado.'),
        );
        this.salvando.set(false);
      },
    });
  }
}
