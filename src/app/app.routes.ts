import { Routes } from '@angular/router';
import { ChamadosLsLista } from './chamados-ls/chamados-ls-lista';
import { ChamadoLsNovo } from './chamados-ls/novo/chamado-ls-novo';
import { ChamadoDetalhe } from './chamados/detalhe/chamado-detalhe';
import { ChamadosLista } from './chamados/lista/chamados-lista';
import { ChamadoNovo } from './chamados/novo/chamado-novo';
import { Dashboard } from './dashboard/dashboard';
import { authGuard } from './guards/auth.guard';
import { Shell } from './layout/shell/shell';
import { Login } from './login/login';
import { UsuarioForm } from './usuarios/form/usuario-form';
import { UsuariosLista } from './usuarios/lista/usuarios-lista';

export const routes: Routes = [
  { path: 'login', component: Login, title: 'Entrar · Chamados' },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'chamados' },
      { path: 'dashboard', component: Dashboard, title: 'Dashboard · Chamados' },
      { path: 'chamados', component: ChamadosLista, title: 'Chamados' },
      // `novo` precisa vir antes de `:id` para não ser capturado como id.
      { path: 'chamados/novo', component: ChamadoNovo, title: 'Novo chamado · Chamados' },
      { path: 'chamados/:id', component: ChamadoDetalhe, title: 'Chamado · Chamados' },
      { path: 'chamados-ls', component: ChamadosLsLista, title: 'Chamados LS · Chamados' },
      { path: 'chamados-ls/novo', component: ChamadoLsNovo, title: 'Novo chamado LS · Chamados' },
      { path: 'usuarios', component: UsuariosLista, title: 'Usuários · Chamados' },
      { path: 'usuarios/novo', component: UsuarioForm, title: 'Novo usuário · Chamados' },
      { path: 'usuarios/:id', component: UsuarioForm, title: 'Usuário · Chamados' },
    ],
  },
  { path: '**', redirectTo: 'chamados' },
];
