import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/create/TopBar'
import LeftPanel from '../components/create/LeftPanel'
import MiddlePanel from '../components/create/MiddlePanel'
import RightPanel from '../components/create/RightPanel'
import ProcessingScreen from '../components/create/ProcessingScreen'
import ResultScreen from '../components/create/ResultScreen'

export default function CreatePage() {
  const navigate = useNavigate()

  // Auth guard
  useEffect(() => {
    if (!localStorage.getItem('360tales_auth')) navigate('/login')
  }, [navigate])

  // App flow
  const [appState, setAppState] = useState('create')  // 'create' | 'processing' | 'result'

  // File state
  const [file,    setFile]    = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [is360,   setIs360]   = useState(false)

  // Preview state
  const [effect,       setEffect]       = useState('slowPan')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [hotspots,     setHotspots]     = useState([])

  // Narration
  const [narration,    setNarration]    = useState('')
  const [aiLoading,    setAiLoading]    = useState(false)
  const [aiGenerated,  setAiGenerated]  = useState(false)

  // Voice & export
  const [language,  setLanguage]  = useState('English')
  const [voiceStyle, setVoiceStyle] = useState('Natural (Female)')
  const [format,    setFormat]    = useState('Standard MP4')

  // Additional options
  const [bgMusic,        setBgMusic]        = useState(false)
  const [musicStyle,     setMusicStyle]     = useState('Ambient')
  const [subtitles,      setSubtitles]      = useState(true)
  const [watermark,      setWatermark]      = useState(false)
  const [watermarkText,  setWatermarkText]  = useState('')

  // Mobile step nav
  const [mobileStep, setMobileStep] = useState(0)  // 0=left 1=middle 2=right

  const handleFileSelect = useCallback((selectedFile, as360 = false) => {
    if (!selectedFile) { setFile(null); setFileUrl(null); setIs360(false); return }
    const url = URL.createObjectURL(selectedFile)
    setFile(selectedFile); setFileUrl(url); setIs360(as360)
    setHotspots([]); setIsPreviewing(false)
  }, [])

  const handleGenerate = () => { if (fileUrl) setAppState('processing') }
  const handleProcessingComplete = () => setAppState('result')
  const handleCreateAnother = () => {
    setFile(null); setFileUrl(null); setIs360(false)
    setNarration(''); setAiGenerated(false); setHotspots([])
    setAppState('create'); setMobileStep(0)
  }

  const handleAiGenerate = () => {
    setAiLoading(true)
    setTimeout(() => {
      setNarration(
        'Welcome to this magnificent destination. This remarkable place has captivated visitors for centuries ' +
        'with its stunning architecture and rich cultural heritage. The site dates back over 400 years and ' +
        'remains one of the most visited landmarks in the region, drawing millions of tourists each year who ' +
        'come to witness its timeless beauty and profound historical significance.'
      )
      setAiLoading(false); setAiGenerated(true)
    }, 2000)
  }

  // Result screen replaces page
  if (appState === 'result') {
    return (
      <ResultScreen
        fileUrl={fileUrl} format={format}
        language={language} voiceStyle={voiceStyle}
        onCreateAnother={handleCreateAnother}
      />
    )
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white">
      <TopBar />

      {/* Processing overlay */}
      {appState === 'processing' && (
        <ProcessingScreen onComplete={handleProcessingComplete} />
      )}

      {/* ── MOBILE step tabs ── */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex gap-1.5 shrink-0">
        {['Input', 'Preview', 'Settings'].map((label, i) => (
          <button key={label} onClick={() => setMobileStep(i)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mobileStep === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>{label}</button>
        ))}
      </div>

      {/* ── MAIN 3-COLUMN LAYOUT ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT — Input */}
        <aside className={`w-full md:w-[30%] lg:w-[320px] xl:w-[360px] shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden
          ${mobileStep !== 0 ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 pt-3 pb-1 shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">1 · Input</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LeftPanel onFileSelect={handleFileSelect} fileUrl={fileUrl} />
          </div>
        </aside>

        {/* MIDDLE — Preview */}
        <main className={`flex-1 bg-gray-50 flex flex-col overflow-hidden min-w-0
          ${mobileStep !== 1 ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 pt-3 pb-1 shrink-0 bg-white border-b border-gray-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">2 · Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MiddlePanel
              fileUrl={fileUrl} is360={is360}
              effect={effect} onEffectChange={setEffect}
              isPreviewing={isPreviewing}
              onTogglePreview={() => setIsPreviewing(v => !v)}
              hotspots={hotspots} onHotspotsChange={setHotspots}
            />
          </div>
        </main>

        {/* RIGHT — Settings */}
        <aside className={`w-full md:w-[30%] lg:w-[320px] xl:w-[380px] shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden
          ${mobileStep !== 2 ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 pt-3 pb-1 shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">3 · Settings & Export</span>
          </div>
          <RightPanel
            narration={narration} onNarrationChange={setNarration}
            aiLoading={aiLoading} aiGenerated={aiGenerated} onAiGenerate={handleAiGenerate}
            language={language} onLanguageChange={setLanguage}
            voiceStyle={voiceStyle} onVoiceStyleChange={setVoiceStyle}
            format={format} onFormatChange={setFormat}
            bgMusic={bgMusic} onBgMusicChange={setBgMusic}
            musicStyle={musicStyle} onMusicStyleChange={setMusicStyle}
            subtitles={subtitles} onSubtitlesChange={setSubtitles}
            watermark={watermark} onWatermarkChange={setWatermark}
            watermarkText={watermarkText} onWatermarkTextChange={setWatermarkText}
            canGenerate={!!fileUrl} onGenerate={handleGenerate}
          />
        </aside>
      </div>

      {/* ── MOBILE bottom nav ── */}
      <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-2 shrink-0">
        {mobileStep > 0 && (
          <button onClick={() => setMobileStep(s => s - 1)} className="btn-outline flex-1 py-2.5 text-sm">Back</button>
        )}
        {mobileStep < 2 ? (
          <button onClick={() => setMobileStep(s => s + 1)} className="btn-primary flex-1 py-2.5 text-sm">Next</button>
        ) : (
          <button onClick={handleGenerate} disabled={!fileUrl}
            className={`btn-primary flex-1 py-2.5 text-sm ${!fileUrl ? 'opacity-50 cursor-not-allowed' : ''}`}>
            Generate Story
          </button>
        )}
      </div>
    </div>
  )
}
