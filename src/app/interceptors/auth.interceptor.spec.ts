import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_URL } from '../services/api';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpTesting.verify());

  it('anexa o token nas requisições autenticadas', () => {
    localStorage.setItem('token', 'abc');
    http.get(`${API_URL}/chamados`).subscribe();

    const req = httpTesting.expectOne(`${API_URL}/chamados`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush([]);
  });

  it('não anexa o token no login', () => {
    localStorage.setItem('token', 'abc');
    http.post(`${API_URL}/login`, {}).subscribe();

    const req = httpTesting.expectOne(`${API_URL}/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ token: 'novo' });
  });

  it('limpa o token e redireciona para o login em 401', () => {
    localStorage.setItem('token', 'expirado');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    http.get(`${API_URL}/chamados`).subscribe({ error: () => {} });

    httpTesting
      .expectOne(`${API_URL}/chamados`)
      .flush({ erro: 'Token expirado' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('não redireciona quando o login falha com 401', () => {
    const navigate = vi.spyOn(router, 'navigate');
    http.post(`${API_URL}/login`, {}).subscribe({ error: () => {} });

    httpTesting
      .expectOne(`${API_URL}/login`)
      .flush({ erro: 'Credenciais inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).not.toHaveBeenCalled();
  });
});
