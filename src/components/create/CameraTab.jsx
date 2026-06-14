import { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, RefreshCw, CheckCircle, AlertCircle, WifiOff } from 'lucide-react'

const MAX_FRAMES = 12
const MIN_FRAMES = 5

function dataURLtoFile(dataUrl, name) {
  const arr  = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  const u8   = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
  return new File([u8], name, { type: mime })
}

/* Stitch frames side-by-side on a canvas and return dataURL */
function stitchFrames(frames) {
  const img0  = new Image()
  img0.src    = frames[0]
  const PH    = 200           // panel height
  const PW    = Math.round(PH * (16 / 9))
  const total = PW * frames.length
  const canvas = document.createElement('canvas')
  canvas.width  = total
  canvas.height = PH
  const ctx = canvas.getContext('2d')
  let loaded = 0
  return new Promise(resolve => {
    frames.forEach((src, i) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, i * PW, 0, PW, PH)
        if (++loaded === frames.length) resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = src
    })
  })
}

export default function CameraTab({ onCapture }) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)
  const intervalRef = useRef(null)
  const framesRef   = useRef([])

  const [permState,      setPermState]      = useState('idle')  // idle | requesting | granted | denied | noCamera | insecure
  const [facingMode,     setFacingMode]     = useState('environment')
  const [panoramic,      setPanoramic]      = useState(false)
  const [capturedPhoto,  setCapturedPhoto]  = useState(null)  // dataURL — single shot
  const [frames,         setFrames]         = useState([])    // panoramic frames
  const [isRecording,    setIsRecording]    = useState(false)
  const [panoramaResult, setPanoramaResult] = useState(null)  // stitched dataURL
  const [stitching,      setStitching]      = useState(false)

  /* Cleanup on unmount */
  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  /* ── Start camera ── */
  const startCamera = async (facing = facingMode) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermState(window.isSecureContext === false ? 'insecure' : 'noCamera')
      return
    }
    setPermState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      // Wait for videoRef to be in the DOM
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
      setPermState('granted')
    } catch (err) {
      const n = err.name
      if (n === 'NotAllowedError' || n === 'PermissionDeniedError') setPermState('denied')
      else if (n === 'NotFoundError' || n === 'DevicesNotFoundError') setPermState('noCamera')
      else if (!window.isSecureContext) setPermState('insecure')
      else setPermState('denied')
    }
  }

  /* Set stream on video element once state switches to granted */
  useEffect(() => {
    if (permState === 'granted' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [permState])

  /* ── Capture single frame ── */
  const captureFrame = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 360
    canvas.getContext('2d').drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  }

  const handleSingleCapture = () => {
    const dataUrl = captureFrame()
    if (!dataUrl) return
    stopStream()
    setCapturedPhoto(dataUrl)
  }

  /* ── Panoramic recording ── */
  const startPanoramicCapture = () => {
    framesRef.current = []
    setFrames([])
    setPanoramaResult(null)
    setIsRecording(true)

    intervalRef.current = setInterval(() => {
      const dataUrl = captureFrame()
      if (!dataUrl) return
      framesRef.current.push(dataUrl)
      setFrames([...framesRef.current])
      if (framesRef.current.length >= MAX_FRAMES) stopPanoramicCapture()
    }, 1500)
  }

  const stopPanoramicCapture = () => {
    clearInterval(intervalRef.current)
    setIsRecording(false)
  }

  const handleStitchAndUse = async () => {
    if (framesRef.current.length < MIN_FRAMES) return
    setStitching(true)
    stopStream()
    const result = await stitchFrames(framesRef.current)
    setPanoramaResult(result)
    setStitching(false)
  }

  const handleUsePanorama = () => {
    if (!panoramaResult) return
    const file = dataURLtoFile(panoramaResult, 'panorama.jpg')
    onCapture(file)
  }

  /* ── Switch camera ── */
  const handleSwitch = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    if (permState === 'granted') startCamera(next)
  }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const handleRetake = () => {
    setCapturedPhoto(null)
    setFrames([])
    framesRef.current = []
    setPanoramaResult(null)
    setIsRecording(false)
    clearInterval(intervalRef.current)
    startCamera(facingMode)
  }

  const handleUsePhoto = () => {
    if (!capturedPhoto) return
    const file = dataURLtoFile(capturedPhoto, 'capture.jpg')
    onCapture(file)
  }

  /* ── Error messages ── */
  const ERROR_MSGS = {
    denied:   'Camera access was denied. Please allow camera access in your browser settings and reload.',
    noCamera: 'No camera detected on this device.',
    insecure: 'Camera requires a secure context (HTTPS or localhost). Please reload over HTTPS.',
  }

  return (
    <div className="space-y-3">
      {/* IDLE */}
      {permState === 'idle' && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center py-12 px-5 text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
            <Camera size={22} className="text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Camera access needed</p>
            <p className="text-xs text-gray-400 mt-0.5">Your camera activates when you click below</p>
          </div>
          <button onClick={() => startCamera(facingMode)} className="btn-primary text-sm px-5 py-2">
            Enable Camera
          </button>
        </div>
      )}

      {/* REQUESTING */}
      {permState === 'requesting' && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center py-14 gap-3">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Requesting camera access…</p>
        </div>
      )}

      {/* ERROR STATES */}
      {['denied', 'noCamera', 'insecure'].includes(permState) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center space-y-2">
          <div className="flex justify-center mb-2">
            {permState === 'insecure'
              ? <WifiOff size={20} className="text-red-400" />
              : <AlertCircle size={20} className="text-red-400" />
            }
          </div>
          <p className="text-sm font-semibold text-red-700">
            {permState === 'denied'   && 'Camera access denied'}
            {permState === 'noCamera' && 'No camera found'}
            {permState === 'insecure' && 'Secure context required'}
          </p>
          <p className="text-xs text-red-500 leading-relaxed">{ERROR_MSGS[permState]}</p>
          {permState !== 'insecure' && (
            <button onClick={() => startCamera(facingMode)} className="btn-outline text-sm px-4 py-2 mt-1">
              Try Again
            </button>
          )}
        </div>
      )}

      {/* GRANTED — live camera */}
      {permState === 'granted' && !capturedPhoto && !panoramaResult && (
        <>
          {/* Video feed */}
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Panoramic overlay */}
            {panoramic && isRecording && (
              <>
                {/* Guide bar */}
                <div className="absolute top-3 inset-x-3 h-6 bg-black/40 rounded-full overflow-hidden border border-white/20 flex items-center">
                  <div
                    className="absolute h-full bg-blue-500/60 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (frames.length / MAX_FRAMES) * 100)}%` }}
                  />
                  {/* Moving dot */}
                  <div
                    className="absolute w-5 h-5 rounded-full bg-white border-2 border-blue-500 shadow transition-all duration-500"
                    style={{ left: `calc(${Math.min(95, (frames.length / MAX_FRAMES) * 100)}% - 10px)` }}
                  />
                </div>
                {/* Instruction */}
                <div className="absolute bottom-14 inset-x-3 flex justify-center">
                  <div className="px-3 py-1.5 bg-black/60 rounded-full">
                    <p className="text-white text-xs text-center">Slowly rotate your device left to right</p>
                  </div>
                </div>
                {/* Frame counter */}
                <div className="absolute top-12 right-3 px-2 py-1 bg-black/60 rounded-lg">
                  <p className="text-white text-xs font-semibold tabular-nums">
                    Frames: {frames.length}/{MAX_FRAMES}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Panoramic frame thumbnails */}
          {panoramic && frames.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {frames.map((f, i) => (
                <img key={i} src={f} alt={`Frame ${i + 1}`}
                  className="h-12 w-20 object-cover rounded border border-gray-200 shrink-0" />
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="space-y-2">
            {/* Panoramic toggle */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-gray-600">Panoramic Mode</span>
              <button
                onClick={() => {
                  const next = !panoramic
                  setPanoramic(next)
                  if (!next) { stopPanoramicCapture(); setFrames([]); framesRef.current = [] }
                }}
                className={`relative w-10 h-5 rounded-full transition-colors ${panoramic ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${panoramic ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSwitch}
                title="Switch camera"
                className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors shrink-0"
              >
                <RefreshCw size={16} />
              </button>

              {!panoramic ? (
                /* Single shot */
                <button onClick={handleSingleCapture} className="btn-primary flex-1 h-10 text-sm gap-2">
                  <Camera size={16} />
                  Capture Photo
                </button>
              ) : !isRecording ? (
                /* Start panoramic */
                <button onClick={startPanoramicCapture} className="btn-primary flex-1 h-10 text-sm">
                  Start Capturing
                </button>
              ) : (
                /* Recording — stop when enough frames */
                <div className="flex-1 flex gap-2">
                  <div className="flex-1 h-10 flex items-center justify-center text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                    Recording…
                  </div>
                  {frames.length >= MIN_FRAMES && (
                    <button
                      onClick={stopPanoramicCapture}
                      className="px-4 h-10 btn-outline text-sm shrink-0"
                    >
                      Stop
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stop & Stitch button */}
            {panoramic && !isRecording && frames.length >= MIN_FRAMES && (
              <button
                onClick={handleStitchAndUse}
                disabled={stitching}
                className="btn-primary w-full h-10 text-sm"
              >
                {stitching
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Stitching…</>
                  : `Stop & Stitch (${frames.length} frames)`
                }
              </button>
            )}
          </div>
        </>
      )}

      {/* SINGLE SHOT PREVIEW */}
      {capturedPhoto && !panoramaResult && (
        <>
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <img src={capturedPhoto} alt="Captured" className="w-full object-cover rounded-xl" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleRetake} className="btn-outline flex-1 text-sm py-2.5">Retake</button>
            <button onClick={handleUsePhoto} className="btn-primary flex-1 text-sm py-2.5">Use This Photo</button>
          </div>
        </>
      )}

      {/* PANORAMA RESULT */}
      {panoramaResult && (
        <>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <img src={panoramaResult} alt="Panorama" className="w-full object-cover" />
            <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500 shrink-0" />
              <span className="text-xs font-medium text-gray-700">{framesRef.current.length} frames stitched</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRetake} className="btn-outline flex-1 text-sm py-2.5">Retake</button>
            <button onClick={handleUsePanorama} className="btn-primary flex-1 text-sm py-2.5">Use as Panorama</button>
          </div>
        </>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
