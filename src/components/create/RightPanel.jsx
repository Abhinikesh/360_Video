import { useState, useRef } from 'react'
import { Sparkles, Check, Volume2, ChevronDown, Play, Loader } from 'lucide-react'
import { useToast } from '../ToastProvider'
import { musicAPI } from '../../services/api'

/* ── All options ── */
const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'Arabic',
  'Japanese', 'German', 'Portuguese', 'Italian', 'Russian',
]
const VOICES = [
  'Natural (Female)', 'Natural (Male)', 'Documentary',
  'Energetic', 'Calm & Peaceful', 'News Anchor', 'Storyteller',
]
const FORMATS = [
  { id: 'Standard MP4',    label: 'Standard MP4',    sub: '16:9 · 1080p'      },
  { id: 'Instagram Reels', label: 'Instagram Reels', sub: '9:16 · 1080p'      },
  { id: 'YouTube 360',     label: 'YouTube 360',     sub: '16:9 · 4K'         },
  { id: 'VR Ready',        label: 'VR Ready',        sub: 'Equirect · 4K'     },
]
const MUSIC_STYLES = ['Ambient', 'Classical', 'Nature Sounds', 'Upbeat Travel', 'Cinematic']

const LANG_CODES = {
  English: 'en-US', Hindi: 'hi-IN', Spanish: 'es-ES', French: 'fr-FR',
  Arabic: 'ar-SA', Japanese: 'ja-JP', German: 'de-DE', Portuguese: 'pt-BR',
  Italian: 'it-IT', Russian: 'ru-RU',
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange, id }) {
  return (
    <button id={id} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 focus:outline-none ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

/* ── Styled select wrapper ── */
function StyledSelect({ id, value, onChange, options }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className="form-input pr-8 appearance-none cursor-pointer bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

function SectionLabel({ children }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">{children}</p>
}

export default function RightPanel({
  narration, onNarrationChange,
  aiLoading, aiGenerated, onAiGenerate,
  language, onLanguageChange,
  voiceStyle, onVoiceStyleChange,
  format, onFormatChange,
  bgMusic, onBgMusicChange,
  musicStyle, onMusicStyleChange,
  subtitles, onSubtitlesChange,
  watermark, onWatermarkChange,
  watermarkText, onWatermarkTextChange,
  canGenerate, onGenerate,
}) {
  const addToast             = useToast()
  const [voicePlaying,  setVoicePlaying]  = useState(false)
  const [musicPreviewing, setMusicPreviewing] = useState(false)
  const musicAudioRef = useRef(null)
  const MAX = 1000

  /* ── Music style preview ── */
  const handleMusicPreview = async () => {
    if (musicPreviewing) {
      // Stop current preview
      if (musicAudioRef.current) {
        musicAudioRef.current.pause()
        musicAudioRef.current = null
      }
      setMusicPreviewing(false)
      return
    }
    setMusicPreviewing(true)
    try {
      const url   = await musicAPI.preview(musicStyle)
      const audio = new Audio(url)
      musicAudioRef.current = audio
      audio.onended = () => { setMusicPreviewing(false); musicAudioRef.current = null }
      audio.onerror = () => { setMusicPreviewing(false); musicAudioRef.current = null }
      audio.play()
    } catch (err) {
      addToast('Music preview failed — is the backend running?')
      setMusicPreviewing(false)
    }
  }

  /* ── Voice preview ── */
  const previewVoice = () => {
    if (!window.speechSynthesis) {
      addToast('Speech synthesis not supported in this browser')
      return
    }
    window.speechSynthesis.cancel()
    setVoicePlaying(true)
    const utterance  = new SpeechSynthesisUtterance(
      'Welcome to Horizon. Experience your story come alive.'
    )
    utterance.lang   = LANG_CODES[language] ?? 'en-US'
    utterance.rate   = 0.9
    utterance.pitch  = voiceStyle === 'Natural (Female)' || voiceStyle === 'Storyteller' ? 1.2
                     : voiceStyle === 'Natural (Male)'  || voiceStyle === 'Documentary'  ? 0.8
                     : voiceStyle === 'Energetic'       ? 1.1
                     : voiceStyle === 'News Anchor'     ? 0.9
                     : 1.0  // Calm & Peaceful
    utterance.onend  = () => setVoicePlaying(false)
    utterance.onerror = () => setVoicePlaying(false)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Scrollable settings area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* ── NARRATION ── */}
        <div>
          <SectionLabel>Narration Script</SectionLabel>
          <label htmlFor="narration" className="form-label">Description / Narration Script</label>
          <textarea
            id="narration"
            rows={6}
            maxLength={MAX}
            value={narration}
            onChange={e => onNarrationChange(e.target.value)}
            placeholder="Describe this place — its history, significance, best time to visit, cultural facts..."
            className="form-input resize-none text-xs leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1.5">
            <button
              onClick={onAiGenerate}
              disabled={aiLoading}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                aiLoading ? 'text-gray-400 cursor-not-allowed'
                : aiGenerated ? 'text-green-600'
                : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {aiLoading
                ? <><span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Analyzing image…</>
                : aiGenerated
                ? <><Check size={13} />Generated</>
                : <><Sparkles size={13} />Auto-Generate with AI</>
              }
            </button>
            <span className="text-[11px] text-gray-400 tabular-nums">{narration.length} / {MAX}</span>
          </div>
        </div>

        {/* ── VOICE ── */}
        <div>
          <SectionLabel>Voice Settings</SectionLabel>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="lang-select" className="form-label">Language</label>
                <StyledSelect
                  id="lang-select"
                  value={language}
                  onChange={onLanguageChange}
                  options={LANGUAGES}
                />
              </div>
              <div>
                <label htmlFor="voice-select" className="form-label">Voice Style</label>
                <StyledSelect
                  id="voice-select"
                  value={voiceStyle}
                  onChange={onVoiceStyleChange}
                  options={VOICES}
                />
              </div>
            </div>
            <button
              onClick={previewVoice}
              disabled={voicePlaying}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                voicePlaying
                  ? 'border-blue-300 bg-blue-50 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Volume2 size={13} />
              {voicePlaying ? 'Playing preview…' : 'Preview Voice (3s)'}
            </button>
          </div>
        </div>

        {/* ── EXPORT FORMAT ── */}
        <div>
          <SectionLabel>Export Format</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {FORMATS.map(f => (
              <button
                key={f.id}
                onClick={() => onFormatChange(f.id)}
                className={`relative flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  format === f.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {format === f.id && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </span>
                )}
                <span className={`text-xs font-semibold leading-tight ${format === f.id ? 'text-blue-700' : 'text-gray-800'}`}>{f.label}</span>
                <span className="text-[11px] text-gray-400 mt-0.5">{f.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── ADDITIONAL OPTIONS ── */}
        <div>
          <SectionLabel>Additional Options</SectionLabel>
          <div className="space-y-4">

            {/* Background Music */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="bgMusic" className="text-sm font-medium text-gray-700 cursor-pointer">Background Music</label>
                <Toggle id="bgMusic" checked={bgMusic} onChange={onBgMusicChange} />
              </div>
              {bgMusic && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <StyledSelect id="musicStyle" value={musicStyle} onChange={onMusicStyleChange} options={MUSIC_STYLES} />
                    </div>
                    <button
                      type="button"
                      onClick={handleMusicPreview}
                      title={musicPreviewing ? 'Stop preview' : 'Preview 5 seconds'}
                      className={`shrink-0 flex items-center gap-1 px-2.5 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                        musicPreviewing
                          ? 'border-blue-300 bg-blue-50 text-blue-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {musicPreviewing
                        ? <><Loader size={12} className="animate-spin" />Stop</>
                        : <><Play size={12} />Play</>}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    🎵 Music plays softly at 15% volume beneath narration
                  </p>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            {/* Burn Subtitles */}
            <div className="flex items-center justify-between">
              <label htmlFor="subtitles" className="text-sm font-medium text-gray-700 cursor-pointer">Burn Subtitles into Video</label>
              <Toggle id="subtitles" checked={subtitles} onChange={onSubtitlesChange} />
            </div>

            <div className="h-px bg-gray-100" />

            {/* Location Watermark */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="watermark" className="text-sm font-medium text-gray-700 cursor-pointer">Location Watermark</label>
                <Toggle id="watermark" checked={watermark} onChange={onWatermarkChange} />
              </div>
              {watermark && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="e.g. Taj Mahal, Agra, India"
                    value={watermarkText}
                    onChange={e => onWatermarkTextChange(e.target.value)}
                    className="form-input text-sm"
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── GENERATE BUTTON — pinned bottom ── */}
      <div className="shrink-0 p-4 border-t border-gray-100 bg-white space-y-1.5">
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className={`w-full h-12 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            canGenerate
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          🎬 Generate 360° Story
        </button>
        <p className="text-xs text-gray-400 text-center">
          {canGenerate ? 'Processing takes 1–3 minutes' : 'Upload a photo or video to get started'}
        </p>
      </div>
    </div>
  )
}
