import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../services/api';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isLogin = req.url === `${API_URL}/login`;
  const token = auth.getToken();

  const autenticada =
    token && !isLogin ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(autenticada).pipe(
    catchError((err: unknown) => {
      // No login, 401 significa credenciais inválidas e é tratado pela tela.
      if (
        !isLogin &&
        err instanceof HttpErrorResponse &&
        (err.status === 401 || err.status === 403)
      ) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
