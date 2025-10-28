import { Loader2 } from 'lucide-react'
function loading() {
  return (
    <div className="flex justify-between items-center gap-2 text-xs font-semibold text-slate-700 h-full ">
      <Loader2 className="animate-spin" size={16} />
      <span>Loading...</span>
    </div>
  )
}

export default loading
