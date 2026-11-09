import { abasVisiveis, paginar, totalDePaginas } from './paginacao';

describe('paginação', () => {
  const itens = Array.from({ length: 60 }, (_, i) => i + 1);

  it('divide em páginas de 15', () => {
    expect(totalDePaginas(60)).toBe(4);
    expect(totalDePaginas(61)).toBe(5);
    expect(totalDePaginas(0)).toBe(1);
    expect(paginar(itens, 1)).toHaveLength(15);
    expect(paginar(itens, 3)).toEqual(itens.slice(30, 45));
  });

  it('página além do fim cai na última', () => {
    expect(paginar(itens, 9)).toEqual(itens.slice(45));
    expect(paginar([1, 2], 3)).toEqual([1, 2]);
  });

  it('mostra todas as abas até 9 páginas', () => {
    expect(abasVisiveis(1, 3)).toEqual([1, 2, 3]);
  });

  it('com muitas páginas mostra as pontas e as vizinhas da atual', () => {
    expect(abasVisiveis(1, 20)).toEqual([1, 2, null, 20]);
    expect(abasVisiveis(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
    expect(abasVisiveis(19, 20)).toEqual([1, null, 18, 19, 20]);
  });
});
