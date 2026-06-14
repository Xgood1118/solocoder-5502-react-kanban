import { create } from 'zustand'
import type { BoardState, CardItem, ColumnItem, PendingOp, PendingOpType } from './types'
import { STATUS_ORDER, STATUS_COLORS, uid, debounce } from './utils'

const STORAGE_KEY = 'kanban-board-v1'

function createInitialState(): BoardState {
  const columns: ColumnItem[] = STATUS_ORDER.map((s, i) => ({
    id: `col-${s.toLowerCase().replace(/\s+/g, '-')}`,
    name: s,
    status: s,
    wipLimit: s === 'In Progress' ? 3 : null,
    color: STATUS_COLORS[s],
    order: i,
  }))

  const cards: CardItem[] = [
    {
      id: uid(),
      title: '初始化项目结构',
      description: '创建 Vite + React + TypeScript 项目脚手架，配置 Tailwind CSS。',
      assignee: '张三',
      priority: 'High',
      tags: ['frontend', 'setup'],
      dueDate: new Date(Date.now() - 86400000 * 1).toISOString().slice(0, 10),
      order: 0,
      columnId: columns[4].id,
    },
    {
      id: uid(),
      title: '实现拖拽排序',
      description: '使用 dnd-kit 实现卡片在列之间和列内的拖拽，包含高亮与插入指示线。',
      assignee: '李四',
      priority: 'Urgent',
      tags: ['dnd', 'core'],
      dueDate: new Date(Date.now() + 86400000 * 1).toISOString().slice(0, 10),
      order: 0,
      columnId: columns[1].id,
    },
    {
      id: uid(),
      title: '状态机规则校验',
      description: 'Blocked 不能直跳 Done；In Review 只能去 Done 或回 In Progress。',
      assignee: '王五',
      priority: 'Medium',
      tags: ['rule'],
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      order: 1,
      columnId: columns[1].id,
    },
    {
      id: uid(),
      title: '编写产品需求文档',
      description: '整理核心看板功能需求、交互细节和验收标准。',
      assignee: '产品经理',
      priority: 'Low',
      tags: ['doc'],
      dueDate: null,
      order: 0,
      columnId: columns[0].id,
    },
    {
      id: uid(),
      title: '依赖第三方接口异常',
      description: '等待第三方服务恢复，当前阻断开发。',
      assignee: '赵六',
      priority: 'High',
      tags: ['blocker', 'backend'],
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      order: 0,
      columnId: columns[3].id,
    },
    {
      id: uid(),
      title: '搜索与快捷键',
      description: '实现标题模糊搜索，n 新建、c 折叠描述、聚焦搜索等快捷键。',
      assignee: '张三',
      priority: 'Medium',
      tags: ['ux'],
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
      order: 0,
      columnId: columns[2].id,
    },
  ]

  return { columns, cards, pendingOps: [] }
}

function loadFromStorage(): BoardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.cards)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

const saveToStorage = debounce((state: BoardState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}, 1000)

interface BoardStore extends BoardState {
  addCard: (card: Omit<CardItem, 'id' | 'order'> & { order?: number }) => void
  updateCard: (id: string, patch: Partial<CardItem>) => void
  deleteCard: (id: string) => void
  moveCard: (cardId: string, toColumnId: string, toIndex: number) => { blocked?: string }
  addColumn: (name: string, status: ColumnItem['status']) => void
  updateColumn: (id: string, patch: Partial<ColumnItem>) => void
  deleteColumn: (id: string) => void
  pushOp: (type: PendingOpType, payload: any) => void
  clearOps: () => void
  importJSON: (data: BoardState) => void
  exportJSON: () => BoardState
  reset: () => void
}

export const useBoardStore = create<BoardStore>((set, get) => {
  const initial = loadFromStorage() ?? createInitialState()
  return {
    ...initial,

    addCard: (card) => {
      const state = get()
      const colCards = state.cards.filter((c) => c.columnId === card.columnId)
      const order = card.order ?? (colCards.length ? Math.max(...colCards.map((c) => c.order)) + 1 : 0)
      const newCard: CardItem = { ...card, id: uid(), order }
      set({ cards: [...state.cards, newCard] })
      get().pushOp('create_card', newCard)
      saveToStorage(get())
    },

    updateCard: (id, patch) => {
      const state = get()
      const cards = state.cards.map((c) => (c.id === id ? { ...c, ...patch } : c))
      set({ cards })
      get().pushOp('update_card', { id, patch })
      saveToStorage(get())
    },

    deleteCard: (id) => {
      const state = get()
      set({ cards: state.cards.filter((c) => c.id !== id) })
      get().pushOp('delete_card', { id })
      saveToStorage(get())
    },

    moveCard: (cardId, toColumnId, toIndex) => {
      const state = get()
      const card = state.cards.find((c) => c.id === cardId)
      if (!card) return {}
      const fromCol = state.columns.find((c) => c.id === card.columnId)
      const toCol = state.columns.find((c) => c.id === toColumnId)
      if (!fromCol || !toCol) return {}

      const targetColCards = state.cards
        .filter((c) => c.columnId === toColumnId && c.id !== cardId)
        .sort((a, b) => a.order - b.order)

      let newOrder = toIndex
      if (targetColCards.length === 0) {
        newOrder = 0
      } else if (toIndex >= targetColCards.length) {
        newOrder = targetColCards[targetColCards.length - 1].order + 1
      } else if (toIndex === 0) {
        newOrder = targetColCards[0].order - 1
      } else {
        newOrder = (targetColCards[toIndex - 1].order + targetColCards[toIndex].order) / 2
      }

      const updatedCard = { ...card, columnId: toColumnId, order: newOrder }
      const cards = state.cards.map((c) => (c.id === cardId ? updatedCard : c))
      set({ cards })
      get().pushOp('move_card', { cardId, toColumnId, toIndex, newOrder })
      saveToStorage(get())
      return {}
    },

    addColumn: (name, status) => {
      const state = get()
      const order = state.columns.length ? Math.max(...state.columns.map((c) => c.order)) + 1 : 0
      const col: ColumnItem = {
        id: uid(),
        name,
        status,
        wipLimit: null,
        color: STATUS_COLORS[status],
        order,
      }
      set({ columns: [...state.columns, col] })
      get().pushOp('create_column', col)
      saveToStorage(get())
    },

    updateColumn: (id, patch) => {
      const state = get()
      const columns = state.columns.map((c) => (c.id === id ? { ...c, ...patch } : c))
      set({ columns })
      get().pushOp('update_column', { id, patch })
      saveToStorage(get())
    },

    deleteColumn: (id) => {
      const state = get()
      set({
        columns: state.columns.filter((c) => c.id !== id),
        cards: state.cards.filter((c) => c.columnId !== id),
      })
      get().pushOp('delete_column', { id })
      saveToStorage(get())
    },

    pushOp: (type, payload) => {
      const state = get()
      const op: PendingOp = { id: uid(), type, payload, timestamp: Date.now() }
      set({ pendingOps: [...state.pendingOps, op] })
    },

    clearOps: () => set({ pendingOps: [] }),

    importJSON: (data) => {
      set({ ...data, pendingOps: [] })
      saveToStorage(get())
    },

    exportJSON: () => {
      const { columns, cards, pendingOps } = get()
      return { columns, cards, pendingOps }
    },

    reset: () => {
      const fresh = createInitialState()
      set(fresh)
      saveToStorage(fresh)
    },
  }
})
