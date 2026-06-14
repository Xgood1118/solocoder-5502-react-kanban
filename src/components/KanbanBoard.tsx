import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useBoardStore } from '../store'
import type { CardItem } from '../types'
import { KanbanColumn } from './KanbanColumn'
import { BoardHeader } from './BoardHeader'
import { CardModal } from './CardModal'
import { KanbanCard } from './KanbanCard'
import { canTransition, transitionErrorMessage, fuzzyMatch } from '../utils'
import { useToast } from '../context/ToastContext'

export function KanbanBoard() {
  const columns = useBoardStore((s) => s.columns)
  const cards = useBoardStore((s) => s.cards)
  const moveCard = useBoardStore((s) => s.moveCard)
  const { show } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const [collapsedAll, setCollapsedAll] = useState(false)
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({})
  const [activeCard, setActiveCard] = useState<CardItem | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardItem | null>(null)
  const [defaultColumnId, setDefaultColumnId] = useState<string | undefined>(undefined)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns],
  )

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards
    return cards.filter((c) => fuzzyMatch(c.title, searchQuery))
  }, [cards, searchQuery])

  const getColumnCards = (colId: string) =>
    filteredCards.filter((c) => c.columnId === colId)

  const handleToggleCardCollapse = (cardId: string) => {
    setCollapsedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }))
  }

  const handleToggleCollapseAll = () => {
    setCollapsedAll((v) => {
      const next = !v
      if (next) setCollapsedCards({})
      return next
    })
  }

  const handleNewCard = (colId?: string) => {
    setEditingCard(null)
    setDefaultColumnId(colId)
    setCardModalOpen(true)
  }

  const handleEditCard = (card: CardItem) => {
    setEditingCard(card)
    setDefaultColumnId(undefined)
    setCardModalOpen(true)
  }

  const handleDragStart = (e: DragStartEvent) => {
    const card = cards.find((c) => c.id === e.active.id)
    if (card) setActiveCard(card)
  }

  const handleDragOver = (e: DragOverEvent) => {
    const over = e.over
    if (!over) {
      setOverColumnId(null)
      return
    }
    const overData = over.data.current as any
    if (overData?.type === 'column') {
      setOverColumnId(over.id as string)
    } else if (overData?.type === 'card') {
      setOverColumnId((overData.card as CardItem).columnId)
    } else {
      setOverColumnId(null)
    }
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveCard(null)
    setOverColumnId(null)
    if (!over) return

    const activeCardData = cards.find((c) => c.id === active.id)
    if (!activeCardData) return

    const fromCol = columns.find((c) => c.id === activeCardData.columnId)
    if (!fromCol) return

    let targetColumnId: string | null = null
    let targetIndex = 0

    const overData = over.data.current as any
    if (overData?.type === 'column') {
      targetColumnId = over.id as string
      const colCards = getColumnCards(targetColumnId).filter((c) => c.id !== active.id)
      targetIndex = colCards.length
    } else if (overData?.type === 'card') {
      const overCard = overData.card as CardItem
      targetColumnId = overCard.columnId
      const colCards = [...getColumnCards(targetColumnId)].sort((a, b) => a.order - b.order)
      const idx = colCards.findIndex((c) => c.id === overCard.id)
      targetIndex = idx >= 0 ? idx : colCards.length
    }

    if (!targetColumnId) return
    const toCol = columns.find((c) => c.id === targetColumnId)
    if (!toCol) return

    // 状态机规则校验
    if (!canTransition(fromCol.status, toCol.status)) {
      const msg = transitionErrorMessage(fromCol.status, toCol.status)
      if (msg) show(msg, 'error')
      return
    }

    // Done 拖出需要二次确认
    if (fromCol.status === 'Done' && toCol.status !== 'Done') {
      if (!confirm('卡片已在 Done 状态，确认将其移出？')) return
    }

    // WIP 超限软提示
    const targetCards = getColumnCards(targetColumnId).filter((c) => c.id !== active.id)
    if (toCol.wipLimit !== null && targetCards.length >= toCol.wipLimit) {
      if (!confirm(`「${toCol.name}」WIP 上限为 ${toCol.wipLimit}，当前将超限，仍要继续？`)) {
        return
      }
    }

    moveCard(active.id as string, targetColumnId, targetIndex)
  }

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <BoardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchRef={searchRef}
        onNewCard={() => handleNewCard()}
        onToggleCollapseAll={handleToggleCollapseAll}
        onImport={() => setCardModalOpen(false)}
      />

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 scrollbar-thin">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedColumns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 h-full items-start">
              {sortedColumns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  cards={getColumnCards(col.id)}
                  isOver={overColumnId === col.id}
                  collapsedAll={collapsedAll}
                  onToggleCollapseAll={handleToggleCollapseAll}
                  collapsedCards={collapsedCards}
                  onToggleCardCollapse={handleToggleCardCollapse}
                  onOpenCardEdit={handleEditCard}
                  onAddCard={() => handleNewCard(col.id)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeCard ? (
              <div className="w-80 opacity-90 rotate-1 shadow-2xl">
                <KanbanCard
                  card={activeCard}
                  collapsed={collapsedAll ? true : collapsedCards[activeCard.id] ?? false}
                  onToggleCollapse={() => {}}
                  onOpenEdit={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <CardModal
        card={editingCard}
        defaultColumnId={defaultColumnId}
        open={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
      />

      <KeyboardShortcuts
        onNewCard={() => handleNewCard()}
        onToggleCollapseAll={handleToggleCollapseAll}
        onFocusSearch={() => searchRef.current?.focus()}
      />
    </div>
  )
}

function KeyboardShortcuts({
  onNewCard,
  onToggleCollapseAll,
  onFocusSearch,
}: {
  onNewCard: () => void
  onToggleCollapseAll: () => void
  onFocusSearch: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onFocusSearch()
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        onNewCard()
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault()
        onToggleCollapseAll()
      } else if (e.key === '/') {
        e.preventDefault()
        onFocusSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNewCard, onToggleCollapseAll, onFocusSearch])
  return null
}
