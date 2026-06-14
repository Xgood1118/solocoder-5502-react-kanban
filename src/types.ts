export type CardStatus = 'Backlog' | 'In Progress' | 'In Review' | 'Blocked' | 'Done'

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent'

export interface CardItem {
  id: string
  title: string
  description: string
  assignee: string
  priority: Priority
  tags: string[]
  dueDate: string | null
  order: number
  columnId: string
}

export interface ColumnItem {
  id: string
  name: string
  status: CardStatus
  wipLimit: number | null
  color: string
  order: number
}

export interface BoardState {
  columns: ColumnItem[]
  cards: CardItem[]
  pendingOps: PendingOp[]
}

export type PendingOpType =
  | 'create_card'
  | 'update_card'
  | 'delete_card'
  | 'move_card'
  | 'create_column'
  | 'update_column'
  | 'delete_column'

export interface PendingOp {
  id: string
  type: PendingOpType
  payload: any
  timestamp: number
}

export interface ToastItem {
  id: string
  message: string
  type: 'info' | 'success' | 'warn' | 'error'
}
