import { Link } from 'react-router-dom'
import { Globe, ArrowLeft, Save, User } from 'lucide-react'

export default function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4 shrink-0 z-20">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Globe size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold text-gray-900 tracking-tight hidden sm:block">
          360<span className="text-blue-600">Tales</span>
        </span>
      </Link>

      <div className="h-5 w-px bg-gray-200 shrink-0" />

      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors shrink-0"
      >
        <ArrowLeft size={15} />
        <span className="hidden sm:block">Dashboard</span>
      </Link>

      {/* Center — page title */}
      <div className="flex-1 flex justify-center">
        <span className="text-sm font-semibold text-gray-700 hidden md:block">Create 360° Story</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
          <Save size={14} />
          Save Draft
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors">
          <User size={15} />
        </div>
      </div>
    </header>
  )
}
