import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['tema'];
  });

  it('sem escolha salva, não força tema no <html>', () => {
    TestBed.inject(ThemeService);
    TestBed.tick();

    expect(document.documentElement.dataset['tema']).toBeUndefined();
  });

  it('alternar salva a escolha e aplica no <html>', () => {
    const theme = TestBed.inject(ThemeService);
    const inicial = theme.tema();

    theme.alternar();
    TestBed.tick();

    const esperado = inicial === 'escuro' ? 'claro' : 'escuro';
    expect(theme.tema()).toBe(esperado);
    expect(localStorage.getItem('tema')).toBe(esperado);
    expect(document.documentElement.dataset['tema']).toBe(esperado);
  });

  it('respeita a escolha salva anteriormente', () => {
    localStorage.setItem('tema', 'escuro');
    const theme = TestBed.inject(ThemeService);

    expect(theme.tema()).toBe('escuro');
  });
});
