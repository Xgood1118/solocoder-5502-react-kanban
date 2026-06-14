import { useEffect, useRef, useState } from 'react'
import type { ColumnItem } from '../types'
import { useBoardStore } from '../store'
import { useToast } from '../context/ToastContext'

interface ColumnHeaderMenuProps {
  column: ColumnItem
  onClose: () => void
}

export function ColumnHeaderMenu({ column, onClose }: ColumnHeaderMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'menu' | 'rename' | 'wip'>('menu')
  const [name, setName] = useState(column.name)
  const [wipValue, setWipValue] = useState<string>(column.wipLimit?.toString() ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const updateColumn = useBoardStore((s) => s.updateColumn)
  const deleteColumn = useBoardStore((s) => s.deleteColumn)
  const columns = useBoardStore((s) => s.columns)
  const { show } = useToast()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (mode === 'rename') {
    return (
      <div
        ref={ref}
        className="menu-enter absolute left-0 top-full mt-2 z-40 bg-white shadow-xl rounded-lg border border-slate-200 p-3 min-w-[220px]"
      >
        <div className="text-xs text-slate-500 mb-2">修改列名</div>
        <input
          autoFocus
          className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) {
              updateColumn(column.id, { name: name.trim() })
              show('列名已更新', 'success')
              onClose()
            } else if (e.key === 'Escape') {
              onClose()
            }
          }}
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="text-xs px-3 py-1 bg-slate-100 rounded hover:bg-slate-200"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={!name.trim()}
            onClick={() => {
              updateColumn(column.id, { name: name.trim() })
              show('列名已更新', 'success')
              onClose()
            }}
          >
            保存
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'wip') {
    return (
      <div
        ref={ref}
        className="menu-enter absolute left-0 top-full mt-2 z-40 bg-white shadow-xl rounded-lg border border-slate-200 p-3 min-w-[220px]"
      >
        <div className="text-xs text-slate-500 mb-2">WIP 上限（留空表示不限制）</div>
        <input
          autoFocus
          type="number"
          min="1"
          className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="例如 3"
          value={wipValue}
          onChange={(e) => setWipValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const n = wipValue.trim() === '' ? null : parseInt(wipValue)
              if (n !== null && isNaN(n)) return
              updateColumn(column.id, { wipLimit: n })
              show(n ? `WIP 上限已设为 ${n}` : 'WIP 限制已取消', 'success')
              onClose()
            } else if (e.key === 'Escape') {
              onClose()
            }
          }}
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="text-xs px-3 py-1 bg-slate-100 rounded hover:bg-slate-200"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              const n = wipValue.trim() === '' ? null : parseInt(wipValue)
              if (n !== null && isNaN(n)) return
              updateColumn(column.id, { wipLimit: n })
              show(n ? `WIP 上限已设为 ${n}` : 'WIP 限制已取消', 'success')
              onClose()
            }}
          >
            保存
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="menu-enter absolute left-0 top-full mt-2 z-40 bg-white shadow-xl rounded-lg border border-slate-200 py-1 min-w-[180px]"
    >
      {!confirmDelete ? (
        <>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
            onClick={() => setMode('rename')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            修改列名
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
            onClick={() => setMode('wip')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            设置 WIP 上限
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={columns.length <= 1}
            onClick={() => setConfirmDelete(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
            删除列
            {columns.length <= 1 && <span className="text-xs text-slate-400 ml-auto">仅剩一列</span>}
          </button>
        </>
      ) : (
        <div className="px-4 py-3">
          <p className="text-sm text-slate-700 mb-3">
            确认删除列「<strong>{column.name}</strong>」？该列下所有卡片将一并删除，操作不可撤销。
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="text-xs px-3 py-1 bg-slate-100 rounded hover:bg-slate-200"
              onClick={() => setConfirmDelete(false)}
            >
              取消
            </button>
            <button
              className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => {
                deleteColumn(column.id)
                show('列已删除', 'success')
                onClose()
              }}
            >
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
