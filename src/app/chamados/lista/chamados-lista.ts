import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ChamadoResponse,
  PRIORIDADE_LABEL,
  SITUACAO_LABEL,
  TIPO_LABEL,
} from '../../models/chamado.model';
import { mensagemErro } from '../../services/api';
import { ChamadoService } from '../../services/chamado.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-chamados-lista',
  imports: [DatePipe, RouterLink],
  templateUrl: './chamados-lista.html',
  styleUrl: './chamados-lista.css',
})
export class ChamadosLista implements OnInit {
  private readonly chamadoService = inject(ChamadoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly situacaoLabel = SITUACAO_LABEL;
  protected readonly prioridadeLabel = PRIORIDADE_LABEL;
  protected readonly tipoLabel = TIPO_LABEL;

  protected readonly chamados = signal<ChamadoResponse[]>([]);
  protected readonly carregando = signal(true);
  protected readonly exportando = signal(false);
  protected readonly busca = signal('');

  protected readonly chamadosFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) {
      return this.chamados();
    }
    return this.chamados().filter((c) =>
      [c.codigoChamado, c.resumo, c.solicitante].some((valor) =>
        valor.toLowerCase().includes(termo),
      ),
    );
  });

  ngOnInit(): void {
    this.chamadoService.listar().subscribe({
      next: (chamados) => {
        this.chamados.set(chamados);
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        this.toast.erro(mensagemErro(err, 'Erro ao carregar os chamados.'));
        this.carregando.set(false);
      },
    });
  }

  protected abrir(chamado: ChamadoResponse): void {
    this.router.navigate(['/chamados', chamado.id]);
  }

  protected exportar(): void {
    this.exportando.set(true);
    this.chamadoService.exportar().subscribe({
      next: (arquivo) => {
        const url = URL.createObjectURL(arquivo);
        const link = document.createElement('a');
        link.href = url;
        const hoje = new Date();
        const data = [
          hoje.getFullYear(),
          String(hoje.getMonth() + 1).padStart(2, '0'),
          String(hoje.getDate()).padStart(2, '0'),
        ].join('-');
        link.download = `chamados-${data}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
        this.exportando.set(false);
      },
      error: () => {
        this.toast.erro('Erro ao exportar os chamados.');
        this.exportando.set(false);
      },
    });
  }
}
