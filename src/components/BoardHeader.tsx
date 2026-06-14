import { useEffect, useRef } from 'react'
import { useBoardStore } from '../store'
import { useToast } from '../context/ToastContext'

interface BoardHeaderProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  searchRef: React.RefObject<HTMLInputElement>
  onNewCard: () => void
  onToggleCollapseAll: () => void
  onImport: () => void
}

export function BoardHeader({
  searchQuery,
  onSearchChange,
  searchRef,
  onNewCard,
  onToggleCollapseAll,
  onImport,
}: BoardHeaderProps) {
  const exportJSON = useBoardStore((s) => s.exportJSON)
  const reset = useBoardStore((s) => s.reset)
  const pendingOps = useBoardStore((s) => s.pendingOps)
  const { show } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = exportJSON()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kanban-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    show('看板数据已导出', 'success')
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!data.columns || !data.cards) throw new Error('格式错误')
        onImport()
        useBoardStore.getState().importJSON(data)
        show('看板数据已导入', 'success')
      } catch {
        show('导入失败：JSON 格式不正确', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    if (confirm('确认重置看板到初始状态？当前所有数据将丢失。')) {
      reset()
      show('看板已重置', 'success')
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          K
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg">团队看板</h1>
          <div className="text-xs text-slate-400">
            待同步操作: {pendingOps.length} 项
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            placeholder="搜索卡片标题..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors"
          onClick={onToggleCollapseAll}
          title="折叠/展开所有卡片描述 (c)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="hidden sm:inline">折叠描述</span>
          <kbd className="hidden sm:inline text-xs bg-white px-1.5 py-0.5 rounded border border-slate-300 ml-1">C</kbd>
        </button>
        <button
          className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors"
          onClick={handleImportClick}
          title="导入 JSON"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span className="hidden sm:inline">导入</span>
        </button>
        <button
          className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors"
          onClick={handleExport}
          title="导出 JSON"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <span className="hidden sm:inline">导出</span>
        </button>
        <button
          className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg flex items-center gap-1 transition-colors"
          onClick={handleReset}
          title="重置看板"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
          </svg>
          <span className="hidden sm:inline">重置</span>
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <button
          className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-1 transition-colors shadow-sm"
          onClick={onNewCard}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>新建卡片</span>
          <kbd className="text-xs bg-blue-400/50 px-1.5 py-0.5 rounded ml-1">N</kbd>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChange}
      />
    </header>
  )
}
