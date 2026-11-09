import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OpcaoSelecao, SelecaoMultipla } from './selecao-multipla';

@Component({
  imports: [SelecaoMultipla],
  template: `
    <app-selecao-multipla
      rotulo="Lotação"
      [opcoes]="opcoes"
      [selecionados]="selecionados()"
      (alterado)="selecionados.set($event)"
    />
    <p class="fora">fora</p>
  `,
})
class Hospedeiro {
  readonly opcoes: OpcaoSelecao[] = [
    { valor: 'FAEC', rotulo: 'FAEC' },
    { valor: 'FAMEP', rotulo: 'FAMEP' },
    { valor: 'PMA', rotulo: 'PMA' },
  ];
  readonly selecionados = signal<string[]>([]);
}

describe('SelecaoMultipla', () => {
  let fixture: ComponentFixture<Hospedeiro>;
  let el: HTMLElement;

  const gatilho = () => el.querySelector<HTMLButtonElement>('.gatilho')!;
  const caixas = () => [...el.querySelectorAll<HTMLInputElement>('.painel input[type=checkbox]')];
  const marcar = async (i: number) => {
    caixas()[i].click();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(Hospedeiro);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('sem nada marcado mostra "Todas" e começa fechado', () => {
    expect(gatilho().textContent).toContain('Todas');
    expect(el.querySelector('.painel')).toBeNull();
  });

  it('permite marcar várias opções, na ordem das opções', async () => {
    gatilho().click();
    await fixture.whenStable();
    await marcar(1);
    await marcar(0);
    expect(fixture.componentInstance.selecionados()).toEqual(['FAEC', 'FAMEP']);
    expect(gatilho().textContent).toContain('FAEC, FAMEP');
    await marcar(2);
    expect(gatilho().textContent).toContain('3 selecionadas');
  });

  it('desmarca e limpa', async () => {
    fixture.componentInstance.selecionados.set(['FAEC', 'PMA']);
    gatilho().click();
    await fixture.whenStable();
    await marcar(0);
    expect(fixture.componentInstance.selecionados()).toEqual(['PMA']);
    el.querySelector<HTMLButtonElement>('.limpar')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selecionados()).toEqual([]);
  });

  it('fecha ao clicar fora', async () => {
    gatilho().click();
    await fixture.whenStable();
    el.querySelector<HTMLElement>('.fora')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.painel')).toBeNull();
  });
});
