import { FormControl, FormGroup, Validators } from '@angular/forms';
import { aplicarErrosDoServidor, igualAo, mensagemDoCampo } from './form-erros';

describe('form-erros', () => {
  it('marca os campos que o servidor recusou e ignora os desconhecidos', () => {
    const form = new FormGroup({ nome: new FormControl('Ana'), email: new FormControl('a@b.c') });

    const destacou = aplicarErrosDoServidor(form, {
      email: 'Já existe um usuário com esse e-mail!',
      campoQueNaoExiste: 'x',
    });

    expect(destacou).toBe(true);
    expect(form.controls.email.touched).toBe(true);
    expect(mensagemDoCampo(form.controls.email)).toBe('Já existe um usuário com esse e-mail!');
    expect(form.controls.nome.valid).toBe(true);
  });

  it('o erro do servidor some quando o campo é editado', () => {
    const form = new FormGroup({ email: new FormControl('a@b.c', Validators.required) });
    aplicarErrosDoServidor(form, { email: 'repetido' });

    form.controls.email.setValue('outro@b.c');

    expect(form.controls.email.valid).toBe(true);
  });

  it('traduz as validações locais', () => {
    const controle = new FormControl('ab', [Validators.minLength(6)]);
    expect(mensagemDoCampo(controle)).toBe('Mínimo de 6 caracteres.');

    controle.setValidators(Validators.maxLength(1));
    controle.updateValueAndValidity();
    expect(mensagemDoCampo(controle)).toBe('Máximo de 1 caracteres.');

    controle.setValidators(Validators.email);
    controle.updateValueAndValidity();
    expect(mensagemDoCampo(controle)).toBe('E-mail inválido.');
  });

  it('confirmação de senha precisa ser igual', () => {
    const form = new FormGroup({
      senha: new FormControl('segredo1'),
      confirmarSenha: new FormControl('outra', igualAo('senha')),
    });
    form.controls.confirmarSenha.updateValueAndValidity();
    expect(mensagemDoCampo(form.controls.confirmarSenha)).toBe('As senhas não conferem.');

    form.controls.confirmarSenha.setValue('segredo1');
    expect(form.controls.confirmarSenha.valid).toBe(true);
  });
});
