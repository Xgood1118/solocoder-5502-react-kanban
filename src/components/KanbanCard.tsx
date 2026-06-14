import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { CardItem } from '../types'
import { PRIORITY_COLORS, daysRemaining } from '../utils'
import { useBoardStore } from '../store'
import { useToast } from '../context/ToastContext'

interface KanbanCardProps {
  card: CardItem
  collapsed: boolean
  onToggleCollapse: () => void
  onOpenEdit: (card: CardItem) => void
}

export function KanbanCard({ card, collapsed, onToggleCollapse, onOpenEdit }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const remaining = daysRemaining(card.dueDate)
  const overdue = remaining !== null && remaining < 0
  const urgent = remaining !== null && remaining >= 0 && remaining < 1
  const updateCard = useBoardStore((s) => s.updateCard)
  const deleteCard = useBoardStore((s) => s.deleteCard)
  const { show } = useToast()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const priorityColor = PRIORITY_COLORS[card.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 cursor-grab active:cursor-grabbing transition-all ${
        overdue ? 'opacity-60' : ''
      }`}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onOpenEdit(card)
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-slate-800 text-sm flex-1 leading-snug">{card.title}</h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="text-slate-400 hover:text-slate-600 p-1 rounded"
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse()
            }}
            title="折叠/展开描述 (c)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? <path d="M5 12h14" /> : <><path d="M5 6h14" /><path d="M5 12h14" /><path d="M5 18h14" /></>}
            </svg>
          </button>
          <button
            className="text-slate-400 hover:text-blue-600 p-1 rounded"
            onClick={(e) => {
              e.stopPropagation()
              onOpenEdit(card)
            }}
            title="编辑"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {!showDeleteConfirm ? (
            <button
              className="text-slate-400 hover:text-red-600 p-1 rounded"
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
              }}
              title="删除"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-xs" onClick={(e) => e.stopPropagation()}>
              <button
                className="px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => {
                  deleteCard(card.id)
                  show('卡片已删除', 'success')
                }}
              >
                确认
              </button>
              <button
                className="px-2 py-0.5 bg-slate-200 rounded hover:bg-slate-300"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>

      {!collapsed && card.description && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-3 leading-relaxed">{card.description}</p>
      )}

      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: priorityColor }}
            title={`优先级: ${card.priority}`}
          />
          <span className="text-slate-500">{card.assignee || '未分配'}</span>
        </div>
        {card.dueDate && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
              overdue
                ? 'bg-slate-200 text-slate-500 line-through'
                : urgent
                  ? 'bg-red-50 text-red-600 font-medium'
                  : 'bg-blue-50 text-blue-600'
            }`}
          >
            {overdue ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
              </svg>
            ) : null}
            <span>
              {overdue
                ? `已过期 ${Math.abs(remaining!)} 天`
                : remaining === 0
                  ? '今天截止'
                  : `剩 ${remaining} 天`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
