import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useEffect, useRef, useState } from 'react'
import type { CardItem, ColumnItem } from '../types'
import { KanbanCard } from './KanbanCard'
import { ColumnHeaderMenu } from './ColumnHeaderMenu'
import { useToast } from '../context/ToastContext'

interface KanbanColumnProps {
  column: ColumnItem
  cards: CardItem[]
  isOver: boolean
  collapsedAll: boolean
  onToggleCollapseAll: () => void
  collapsedCards: Record<string, boolean>
  onToggleCardCollapse: (cardId: string) => void
  onOpenCardEdit: (card: CardItem) => void
  onAddCard: () => void
}

export function KanbanColumn({
  column,
  cards,
  isOver,
  collapsedAll,
  onToggleCollapseAll,
  collapsedCards,
  onToggleCardCollapse,
  onOpenCardEdit,
  onAddCard,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id, data: { type: 'column', column } })
  const [menuOpen, setMenuOpen] = useState(false)
  const pressTimer = useRef<any>(null)
  const [pressing, setPressing] = useState(false)
  const { show } = useToast()

  const sortedCards = [...cards].sort((a, b) => a.order - b.order)
  const wipExceeded = column.wipLimit !== null && sortedCards.length > column.wipLimit

  const startPress = () => {
    setPressing(true)
    pressTimer.current = setTimeout(() => {
      setMenuOpen(true)
      setPressing(false)
    }, 1000)
  }
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    setPressing(false)
  }

  useEffect(() => () => cancelPress(), [])

  return (
    <div
      className={`flex flex-col bg-slate-100 rounded-xl w-80 flex-shrink-0 h-full transition-all ${
        isOver ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50' : ''
      }`}
    >
      <div
        className={`relative px-4 py-3 rounded-t-xl cursor-pointer select-none transition-all ${
          pressing ? 'scale-[0.98]' : ''
        }`}
        style={{ backgroundColor: column.color + '22' }}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-semibold text-slate-800 truncate">{column.name}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                wipExceeded ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {sortedCards.length}
              {column.wipLimit !== null ? ` / ${column.wipLimit}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapseAll()
              }}
              title={collapsedAll ? '展开全部卡片描述' : '折叠全部卡片描述 (c)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {collapsedAll ? (
                  <path d="M6 9l6 6 6-6" />
                ) : (
                  <path d="M6 15l6-6 6 6" />
                )}
              </svg>
            </button>
            <button
              className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(true)
              }}
              title="长按或点击打开列菜单"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </div>
        {pressing && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 animate-[progress_1s_linear]" style={{ width: '100%' }} />
        )}
        {menuOpen && <ColumnHeaderMenu column={column} onClose={() => setMenuOpen(false)} />}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2 min-h-[200px] transition-colors ${
          isOver ? 'bg-blue-50/60' : ''
        }`}
      >
        <SortableContext items={sortedCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {sortedCards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              collapsed={collapsedAll ? true : collapsedCards[card.id] ?? false}
              onToggleCollapse={() => onToggleCardCollapse(card.id)}
              onOpenEdit={onOpenCardEdit}
            />
          ))}
        </SortableContext>
        {sortedCards.length === 0 && (
          <div className="text-center text-slate-400 text-xs py-8">暂无卡片，拖入或新建</div>
        )}
      </div>

      <div className="p-2 border-t border-slate-200/70">
        <button
          className="w-full text-sm text-slate-600 hover:text-slate-800 hover:bg-white rounded py-2 flex items-center justify-center gap-1 transition-colors"
          onClick={onAddCard}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          新建卡片
        </button>
      </div>
    </div>
  )
}
