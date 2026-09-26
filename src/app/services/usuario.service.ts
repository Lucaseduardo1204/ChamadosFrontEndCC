import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario, UsuarioAtualizacao, UsuarioRequest } from '../models/usuario.model';
import { API_URL } from './api';

// Alterações usam PATCH: o CORS do backend não libera PUT.
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  buscar(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/${id}`);
  }

  /** O usuário logado. */
  eu(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/me`);
  }

  criar(usuario: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.url, usuario);
  }

  atualizar(id: number, usuario: UsuarioAtualizacao): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}`, usuario);
  }

  alterarSenha(id: number, senha: string): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/senha`, { senha });
  }

  /** Não há exclusão: usuários são desativados, porque chamados e interações apontam para eles. */
  alterarAtivo(id: number, ativo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/ativo`, { ativo });
  }
}
