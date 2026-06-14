import { ToastProvider } from './context/ToastContext'
import { KanbanBoard } from './components/KanbanBoard'

export default function App() {
  return (
    <ToastProvider>
      <KanbanBoard />
    </ToastProvider>
  )
}
