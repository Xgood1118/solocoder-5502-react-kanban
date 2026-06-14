import type { CardStatus, Priority } from './types'

export const STATUS_COLORS: Record<CardStatus, string> = {
  Backlog: '#94a3b8',
  'In Progress': '#3b82f6',
  'In Review': '#a855f7',
  Blocked: '#ef4444',
  Done: '#22c55e',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  Low: '#94a3b8',
  Medium: '#f59e0b',
  High: '#f97316',
  Urgent: '#ef4444',
}

export const STATUS_ORDER: CardStatus[] = ['Backlog', 'In Progress', 'In Review', 'Blocked', 'Done']

export function canTransition(from: CardStatus, to: CardStatus): boolean {
  if (from === to) return true
  if (from === 'Blocked' && to === 'Done') return false
  if (from === 'In Review' && !(to === 'Done' || to === 'In Progress')) return false
  return true
}

export function transitionErrorMessage(from: CardStatus, to: CardStatus): string | null {
  if (from === to) return null
  if (from === 'Blocked' && to === 'Done') return 'Blocked 状态的卡片不能直接移至 Done'
  if (from === 'In Review' && to !== 'Done' && to !== 'In Progress') {
    return 'In Review 只能移至 Done 或回退到 In Progress'
  }
  return null
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function daysRemaining(dueDate: string | null): number | null {
  if (!dueDate) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function fuzzyMatch(text: string, query: string): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return text.toLowerCase().includes(q)
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let t: any = null
  return ((...args: any[]) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }) as T
}
