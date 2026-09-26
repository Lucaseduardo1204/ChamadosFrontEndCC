import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';

/**
 * Marca os campos rejeitados pelo `@Valid` do backend (ver `errosDeCampo`). O erro some sozinho quando o
 * usuário edita o campo, porque o Angular recalcula os validadores. Retorna se algum campo foi marcado.
 */
export function aplicarErrosDoServidor(
  form: FormGroup,
  erros: Record<string, string> | null,
): boolean {
  let destacou = false;
  for (const [campo, mensagem] of Object.entries(erros ?? {})) {
    const controle = form.get(campo);
    if (controle) {
      marcarErroDoServidor(controle, mensagem);
      destacou = true;
    }
  }
  return destacou;
}

export function marcarErroDoServidor(controle: AbstractControl, mensagem: string): void {
  controle.setErrors({ ...controle.errors, servidor: mensagem });
  controle.markAsTouched();
}

/** Mensagem a exibir sob um campo inválido: a do servidor, se houver; senão, a da validação local. */
export function mensagemDoCampo(controle: AbstractControl): string {
  const erros = controle.errors ?? {};
  if (typeof erros['servidor'] === 'string') {
    return erros['servidor'];
  }
  if (erros['maxlength']) {
    return `Máximo de ${erros['maxlength'].requiredLength} caracteres.`;
  }
  if (erros['minlength']) {
    return `Mínimo de ${erros['minlength'].requiredLength} caracteres.`;
  }
  if (erros['email']) {
    return 'E-mail inválido.';
  }
  if (erros['senhasDiferentes']) {
    return 'As senhas não conferem.';
  }
  return 'Campo obrigatório.';
}

/** Valida um campo de confirmação contra outro campo do mesmo grupo (ex.: confirmar senha). */
export function igualAo(campo: string): ValidatorFn {
  return (controle) => {
    const original = controle.parent?.get(campo);
    return original && controle.value !== original.value ? { senhasDiferentes: true } : null;
  };
}
