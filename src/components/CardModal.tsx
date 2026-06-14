import { useEffect, useState } from 'react'
import type { CardItem, CardStatus, Priority } from '../types'
import { useBoardStore } from '../store'
import { useToast } from '../context/ToastContext'

interface CardModalProps {
  card: CardItem | null
  defaultColumnId?: string
  open: boolean
  onClose: () => void
}

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent']

export function CardModal({ card, defaultColumnId, open, onClose }: CardModalProps) {
  const columns = useBoardStore((s) => s.columns)
  const addCard = useBoardStore((s) => s.addCard)
  const updateCard = useBoardStore((s) => s.updateCard)
  const { show } = useToast()

  const isEdit = !!card

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [tagsStr, setTagsStr] = useState('')
  const [dueDate, setDueDate] = useState<string>('')
  const [columnId, setColumnId] = useState<string>('')

  useEffect(() => {
    if (open) {
      if (card) {
        setTitle(card.title)
        setDescription(card.description)
        setAssignee(card.assignee)
        setPriority(card.priority)
        setTagsStr(card.tags.join(', '))
        setDueDate(card.dueDate ?? '')
        setColumnId(card.columnId)
      } else {
        setTitle('')
        setDescription('')
        setAssignee('')
        setPriority('Medium')
        setTagsStr('')
        setDueDate('')
        setColumnId(defaultColumnId ?? columns[0]?.id ?? '')
      }
    }
  }, [open, card, defaultColumnId, columns])

  if (!open) return null

  const handleSave = () => {
    if (!title.trim()) {
      show('请填写卡片标题', 'warn')
      return
    }
    const tags = tagsStr
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
    const payload = {
      title: title.trim(),
      description: description.trim(),
      assignee: assignee.trim(),
      priority,
      tags,
      dueDate: dueDate || null,
      columnId,
    }
    if (isEdit && card) {
      updateCard(card.id, payload)
      show('卡片已更新', 'success')
    } else {
      addCard(payload)
      show('卡片已创建', 'success')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? '编辑卡片' : '新建卡片 (n)'}
          </h2>
          <button
            className="text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">标题 *</label>
            <input
              autoFocus
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入卡片标题"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
                if (e.key === 'Escape') onClose()
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入卡片描述"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">负责人</label>
              <input
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="负责人姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">优先级</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">标签（用逗号或空格分隔）</label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="例如: frontend, urgent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">截止日期</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">所在列</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={handleSave}
          >
            {isEdit ? '保存修改' : '创建卡片'}
          </button>
        </div>
      </div>
    </div>
  )
}
