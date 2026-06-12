/** Pequenas funcoes de formatacao usadas nas paginas. */

/** Converte um Date para o formato yyyy-MM-dd (o que a API espera). */
export function paraISO(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Mostra uma data yyyy-MM-dd como dd/MM/yyyy. */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

/** Mostra um numero como moeda brasileira (R$). */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
