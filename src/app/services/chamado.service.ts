import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ChamadoRequest, ChamadoResponse, Situacao } from '../models/chamado.model';
import { InteracaoResponse } from '../models/interacao.model';
import { API_URL } from './api';

@Injectable({ providedIn: 'root' })
export class ChamadoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/chamados`;

  listar(): Observable<ChamadoResponse[]> {
    return this.http.get<ChamadoResponse[]>(this.url);
  }

  buscar(id: number): Observable<ChamadoResponse> {
    return this.http.get<ChamadoResponse>(`${this.url}/${id}`);
  }

  criar(chamado: ChamadoRequest): Observable<ChamadoResponse> {
    return this.http.post<ChamadoResponse>(this.url, chamado);
  }

  alterarResponsavel(id: number, responsavelId: number): Observable<ChamadoResponse> {
    return this.http.patch<ChamadoResponse>(`${this.url}/${id}/responsavel`, { responsavelId });
  }

  alterarSituacao(id: number, situacao: Situacao): Observable<ChamadoResponse> {
    return this.http.patch<ChamadoResponse>(`${this.url}/${id}/situacao`, { situacao });
  }

  /** Soft delete: o backend marca o chamado como inativo. */
  inativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  exportar(): Observable<Blob> {
    return this.http.get(`${this.url}/exportar`, { responseType: 'blob' });
  }

  listarInteracoes(id: number): Observable<InteracaoResponse[]> {
    return this.http.get<InteracaoResponse[]>(`${this.url}/${id}/interacoes`);
  }

  /** O autor é obtido pelo backend a partir do token. */
  comentar(id: number, texto: string): Observable<InteracaoResponse> {
    return this.http.post<InteracaoResponse>(`${this.url}/${id}/interacoes`, { texto });
  }
}
