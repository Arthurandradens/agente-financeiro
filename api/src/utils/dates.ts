export function formatDateForGrouping(date: string, groupBy: 'day' | 'week' | 'month'): string {
  const d = new Date(date)
  
  if (groupBy === 'day') {
    return date
  } else if (groupBy === 'week') {
    // Início da semana (domingo)
    const startOfWeek = new Date(d)
    startOfWeek.setDate(d.getDate() - d.getDay())
    return startOfWeek.toISOString().split('T')[0]
  } else { // month
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
}

export function isTransferenciaInterna(categoria: string, observacoes: string): boolean {
  const cat = categoria.toLowerCase()
  const obs = observacoes?.toLowerCase() || ''
  return cat.includes('transferência interna') || obs.includes('transferência interna')
}

export function isPagamentoFatura(categoria: string, subcategoria: string): boolean {
  const cat = categoria.toLowerCase()
  const sub = subcategoria?.toLowerCase() || ''
  return cat.includes('cartão de crédito') && sub.includes('pagamento de fatura')
}
