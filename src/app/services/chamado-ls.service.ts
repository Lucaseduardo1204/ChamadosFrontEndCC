import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlterarSituacaoLs, ChamadoLsRequest, ChamadoLsResponse } from '../models/chamado-ls.model';
import { API_URL } from './api';

@Injectable({ providedIn: 'root' })
export class ChamadoLsService {
  private readonly http = inject(HttpClient);

  listar(): Observable<ChamadoLsResponse[]> {
    return this.http.get<ChamadoLsResponse[]>(`${API_URL}/chamados-ls`);
  }

  listarDoChamado(chamadoId: number): Observable<ChamadoLsResponse[]> {
    return this.http.get<ChamadoLsResponse[]>(`${API_URL}/chamados/${chamadoId}/ls`);
  }

  /** Chamado do LS independente; o relacionado (opcional) vai em `chamadoId`. O analista vem do token. */
  criar(request: ChamadoLsRequest): Observable<ChamadoLsResponse> {
    return this.http.post<ChamadoLsResponse>(`${API_URL}/chamados-ls`, request);
  }

  /** O analista que abriu é obtido pelo backend a partir do token. */
  abrir(chamadoId: number, request: ChamadoLsRequest): Observable<ChamadoLsResponse> {
    return this.http.post<ChamadoLsResponse>(`${API_URL}/chamados/${chamadoId}/ls`, request);
  }

  alterarSituacao(id: number, request: AlterarSituacaoLs): Observable<ChamadoLsResponse> {
    return this.http.patch<ChamadoLsResponse>(`${API_URL}/chamados-ls/${id}/situacao`, request);
  }
}
