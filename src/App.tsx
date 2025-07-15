import { useState, useRef, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Input } from './components/ui/input'
import { Textarea } from './components/ui/textarea'
import { Slider } from './components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Badge } from './components/ui/badge'
import { blink } from './blink/client'
import { 
  Play, 
  Pause, 
  Download, 
  Type, 
  Palette, 
  Clock, 
  Sparkles,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Mic,
  Volume2,
  FileVideo,
  Loader2
} from 'lucide-react'

interface TextElement {
  id: string
  text: string
  startTime: number
  duration: number
  fontSize: number
  color: string
  fontWeight: string
  animation: string
  position: { x: number; y: number }
  visible: boolean
}



interface WordElement {
  id: string
  word: string
  startTime: number
  duration: number
  fontSize: number
  color: string
  fontWeight: string
  animation: string
  position: { x: number; y: number }
}

const ANIMATION_PRESETS = [
  { value: 'fade', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'zoom', label: 'Zoom In' }
]

const BACKGROUND_OPTIONS = [
  { value: 'gradient-1', label: 'Pink Gradient', style: 'linear-gradient(135deg, #FF0050, #FF4081)' },
  { value: 'gradient-2', label: 'Cyan Gradient', style: 'linear-gradient(135deg, #00F2EA, #4FC3F7)' },
  { value: 'gradient-3', label: 'Purple Gradient', style: 'linear-gradient(135deg, #9C27B0, #E91E63)' },
  { value: 'gradient-4', label: 'Blue Gradient', style: 'linear-gradient(135deg, #2196F3, #00BCD4)' },
  { value: 'solid-black', label: 'Black', style: '#000000' },
  { value: 'solid-white', label: 'White', style: '#FFFFFF' },
  { value: 'solid-red', label: 'Red', style: '#FF0050' },
  { value: 'solid-cyan', label: 'Cyan', style: '#00F2EA' }
]

const TTS_VOICES = [
  { value: 'alloy', label: 'Alloy (Neutral)' },
  { value: 'echo', label: 'Echo (Male)' },
  { value: 'fable', label: 'Fable (British Male)' },
  { value: 'onyx', label: 'Onyx (Deep Male)' },
  { value: 'nova', label: 'Nova (Female)' },
  { value: 'shimmer', label: 'Shimmer (Female)' }
]

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [textElements, setTextElements] = useState<TextElement[]>([])

  const [wordElements, setWordElements] = useState<WordElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoDuration, setVideoDuration] = useState(15)
  const [background, setBackground] = useState(BACKGROUND_OPTIONS[0])
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [ttsText, setTtsText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState(TTS_VOICES[0].value)
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioOffset, setAudioOffset] = useState(0) // Audio sync offset in seconds
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Animation playback
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= videoDuration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 0.1
        })
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, videoDuration])

  // Sync video and audio playback with better error handling
  useEffect(() => {
    const syncMedia = async () => {
      try {
        if (videoRef.current) {
          videoRef.current.currentTime = currentTime
          if (isPlaying) {
            await videoRef.current.play()
          } else {
            videoRef.current.pause()
          }
        }
        
        if (audioRef.current) {
          // Ensure audio is loaded before setting time
          if (audioRef.current.readyState >= 2) {
            // Apply audio offset for synchronization
            const adjustedTime = Math.max(0, currentTime + audioOffset)
            audioRef.current.currentTime = adjustedTime
            if (isPlaying) {
              await audioRef.current.play()
            } else {
              audioRef.current.pause()
            }
          }
        }
      } catch (error) {
        console.warn('Media sync error:', error)
      }
    }
    
    syncMedia()
  }, [audioOffset, currentTime, isPlaying])

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const { publicUrl } = await blink.storage.upload(
        file,
        `videos/${file.name}`,
        { upsert: true }
      )
      
      setCustomVideoUrl(publicUrl)
      
      // Create a temporary video element to get duration
      const tempVideo = document.createElement('video')
      tempVideo.src = publicUrl
      tempVideo.onloadedmetadata = () => {
        setVideoDuration(tempVideo.duration)
        tempVideo.remove()
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Failed to upload video. Please try again.')
    }
  }

  const generateTTSWithCaptions = async () => {
    if (!ttsText.trim()) return

    setIsGeneratingTTS(true)
    try {
      // Generate speech
      const { url: speechUrl } = await blink.ai.generateSpeech({
        text: ttsText,
        voice: selectedVoice as any
      })
      
      setAudioUrl(speechUrl)

      // Get actual audio duration for precise timing
      const audio = new Audio(speechUrl)
      await new Promise((resolve) => {
        audio.onloadedmetadata = resolve
      })
      
      const actualAudioDuration = audio.duration
      
      // Simple word-by-word timing - evenly distribute words across audio duration
      const words = ttsText.split(/\s+/).filter(word => word.length > 0)
      const wordDuration = actualAudioDuration / words.length
      
      // Create individual word elements with simple, even timing
      const newWordElements: WordElement[] = words.map((word, index) => ({
        id: `word-${index}`,
        word: word.replace(/[.,!?;:]$/, ''), // Clean punctuation for display
        startTime: index * wordDuration,
        duration: wordDuration,
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: '700',
        animation: 'word-pop',
        position: { x: 50, y: 85 } // Bottom center of screen
      }))
      
      setWordElements(newWordElements)
      
      // Update video duration to match actual audio length with small buffer
      setVideoDuration(Math.max(actualAudioDuration + 0.5, videoDuration))
      
    } catch (error) {
      console.error('Error generating TTS:', error)
      alert('Failed to generate speech. Please try again.')
    } finally {
      setIsGeneratingTTS(false)
    }
  }

  const addTextElement = () => {
    if (!newText.trim()) return
    
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: newText,
      startTime: currentTime,
      duration: 3,
      fontSize: 32,
      color: '#FFFFFF',
      fontWeight: '600',
      animation: 'fade',
      position: { x: 50, y: 50 },
      visible: true
    }
    
    setTextElements(prev => [...prev, newElement])
    setSelectedElement(newElement.id)
    setNewText('')
  }

  const updateElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    )
  }

  const deleteElement = (id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }

  const toggleElementVisibility = (id: string) => {
    updateElement(id, { visible: !textElements.find(el => el.id === id)?.visible })
  }

  const getVisibleElements = () => {
    return textElements.filter(el => 
      el.visible && 
      currentTime >= el.startTime && 
      currentTime <= el.startTime + el.duration
    )
  }

  const getCurrentWord = () => {
    return wordElements.find(word => 
      currentTime >= word.startTime && 
      currentTime < word.startTime + word.duration
    )
  }

  const selectedElementData = textElements.find(el => el.id === selectedElement)

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const resetPlayback = () => {
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const exportVideo = () => {
    alert('Video export functionality would be implemented here!')
  }

  const clearCaptions = () => {
    setWordElements([])
    setTextElements(prev => prev.filter(el => !el.id.startsWith('auto-caption-')))
    setAudioUrl(null)
    setAudioOffset(0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">TikTok Video Creator</h1>
          <p className="text-muted-foreground mb-4">Please sign in to continue</p>
          <Button onClick={() => blink.auth.login()}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">TikTok Video Creator</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
            <Button variant="outline" onClick={resetPlayback}>
              Reset
            </Button>
            <Button onClick={exportVideo} className="bg-primary hover:bg-primary/90">
              <Download className="h-4 w-4 mr-2" />
              Export Video
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Controls */}
        <div className="w-80 border-r border-border bg-card overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Video Background */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileVideo className="h-4 w-4" />
                Video Background
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Custom Video
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                {customVideoUrl && (
                  <div className="text-sm text-green-400">
                    ✓ Custom video uploaded
                  </div>
                )}
              </div>
            </Card>

            {/* Text-to-Speech */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Text-to-Speech & Auto Captions
              </h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Enter text to convert to speech with auto captions..."
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  className="min-h-[80px]"
                />
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TTS_VOICES.map(voice => (
                      <SelectItem key={voice.value} value={voice.value}>
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button 
                    onClick={generateTTSWithCaptions} 
                    disabled={!ttsText.trim() || isGeneratingTTS}
                    className="flex-1"
                  >
                    {isGeneratingTTS ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                  {wordElements.length > 0 && (
                    <Button variant="outline" onClick={clearCaptions}>
                      Clear
                    </Button>
                  )}
                </div>
                {wordElements.length > 0 && (
                  <div className="text-sm text-green-400">
                    ✓ {wordElements.length} words ready for animation
                  </div>
                )}
                {audioUrl && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Audio Sync Offset: {audioOffset.toFixed(2)}s</label>
                    <Slider
                      value={[audioOffset]}
                      onValueChange={([value]) => setAudioOffset(value)}
                      min={-2}
                      max={2}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>-2s (Audio Earlier)</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setAudioOffset(0)}
                        className="h-6 px-2 text-xs"
                      >
                        Reset
                      </Button>
                      <span>+2s (Audio Later)</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Add Text */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Add Manual Text
              </h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Enter your text..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button onClick={addTextElement} className="w-full" disabled={!newText.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Text
                </Button>
              </div>
            </Card>

            {/* Background */}
            {!customVideoUrl && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Background
                </h3>
                <Select value={background.value} onValueChange={(value) => {
                  const bg = BACKGROUND_OPTIONS.find(b => b.value === value)
                  if (bg) setBackground(bg)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKGROUND_OPTIONS.map(bg => (
                      <SelectItem key={bg.value} value={bg.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ background: bg.style }}
                          />
                          {bg.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            )}

            {/* Text Elements List */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Text Elements</h3>
              <div className="space-y-2">
                {textElements.map(element => (
                  <div 
                    key={element.id}
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      selectedElement === element.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{element.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {element.startTime.toFixed(1)}s - {(element.startTime + element.duration).toFixed(1)}s
                          {element.id.startsWith('auto-caption-') && (
                            <span className="ml-2 text-accent">Auto Caption</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleElementVisibility(element.id)
                          }}
                        >
                          {element.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteElement(element.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {textElements.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No text elements yet. Add some text to get started!
                  </p>
                )}
              </div>
            </Card>

            {/* Element Properties */}
            {selectedElementData && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Element Properties</h3>
                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text">Text</TabsTrigger>
                    <TabsTrigger value="timing">Timing</TabsTrigger>
                    <TabsTrigger value="animation">Animation</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Text Content</label>
                      <Textarea
                        value={selectedElementData.text}
                        onChange={(e) => updateElement(selectedElementData.id, { text: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Font Size: {selectedElementData.fontSize}px</label>
                      <Slider
                        value={[selectedElementData.fontSize]}
                        onValueChange={([value]) => updateElement(selectedElementData.id, { fontSize: value })}
                        min={16}
                        max={72}
                        step={2}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Color</label>
                      <Input
                        type="color"
                        value={selectedElementData.color}
                        onChange={(e) => updateElement(selectedElementData.id, { color: e.target.value })}
                        className="mt-1 h-10"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Font Weight</label>
                      <Select 
                        value={selectedElementData.fontWeight} 
                        onValueChange={(value) => updateElement(selectedElementData.id, { fontWeight: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">Normal</SelectItem>
                          <SelectItem value="500">Medium</SelectItem>
                          <SelectItem value="600">Semi Bold</SelectItem>
                          <SelectItem value="700">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="timing" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Start Time: {selectedElementData.startTime.toFixed(1)}s</label>
                      <Slider
                        value={[selectedElementData.startTime]}
                        onValueChange={([value]) => updateElement(selectedElementData.id, { startTime: value })}
                        min={0}
                        max={videoDuration - 0.5}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duration: {selectedElementData.duration.toFixed(1)}s</label>
                      <Slider
                        value={[selectedElementData.duration]}
                        onValueChange={([value]) => updateElement(selectedElementData.id, { duration: value })}
                        min={0.5}
                        max={videoDuration}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="animation" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Animation</label>
                      <Select 
                        value={selectedElementData.animation} 
                        onValueChange={(value) => updateElement(selectedElementData.id, { animation: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ANIMATION_PRESETS.map(anim => (
                            <SelectItem key={anim.value} value={anim.value}>
                              {anim.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            )}
          </div>
        </div>

        {/* Center - Video Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative">
              <div 
                ref={canvasRef}
                className="w-[300px] h-[533px] relative overflow-hidden rounded-lg border-2 border-border shadow-2xl"
                style={{ background: customVideoUrl ? 'transparent' : background.style }}
              >
                {/* Custom Video Background */}
                {customVideoUrl && (
                  <video
                    ref={videoRef}
                    src={customVideoUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    loop
                  />
                )}

                {/* Manual Text Elements */}
                {getVisibleElements().map(element => (
                  <div
                    key={element.id}
                    className={`absolute text-center font-inter transition-all duration-500 select-none cursor-pointer ${
                      element.animation === 'fade' ? 'animate-fade-in' :
                      element.animation === 'slide-up' ? 'animate-slide-up' :
                      element.animation === 'slide-down' ? 'animate-slide-down' :
                      element.animation === 'slide-left' ? 'animate-slide-left' :
                      element.animation === 'slide-right' ? 'animate-slide-right' :
                      element.animation === 'typewriter' ? 'animate-typewriter' :
                      element.animation === 'bounce' ? 'animate-bounce' :
                      element.animation === 'zoom' ? 'animate-zoom' :
                      'animate-fade-in'
                    }`}
                    style={{
                      left: `${element.position.x}%`,
                      top: `${element.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${element.fontSize}px`,
                      color: element.color,
                      fontWeight: element.fontWeight,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      maxWidth: '90%',
                      wordWrap: 'break-word'
                    }}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    {element.text}
                  </div>
                ))}

                {/* Animated Word Captions */}
                {(() => {
                  const currentWord = getCurrentWord()
                  return currentWord ? (
                    <div
                      key={currentWord.id}
                      className="absolute text-center font-inter animate-word-pop select-none"
                      style={{
                        left: `${currentWord.position.x}%`,
                        top: `${currentWord.position.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${currentWord.fontSize}px`,
                        color: currentWord.color,
                        fontWeight: currentWord.fontWeight,
                        textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                        maxWidth: '90%',
                        wordWrap: 'break-word',
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.3)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '2px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      {currentWord.word}
                    </div>
                  ) : null
                })()}


                
                {/* Canvas overlay for selection */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2 left-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                    9:16 • {currentTime.toFixed(1)}s
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="border-t border-border bg-card p-4">
            <div className="flex items-center gap-4 mb-4">
              <Button
                size="sm"
                variant={isPlaying ? "default" : "outline"}
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>{currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s</span>
              </div>
              <Badge variant="secondary">
                {textElements.length} text element{textElements.length !== 1 ? 's' : ''}
              </Badge>
              {wordElements.length > 0 && (
                <Badge variant="outline" className="text-accent border-accent">
                  {wordElements.length} words ready for animation
                </Badge>
              )}
            </div>
            
            {/* Timeline Scrubber */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                onValueChange={([value]) => setCurrentTime(value)}
                min={0}
                max={videoDuration}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0s</span>
                <span>{videoDuration.toFixed(1)}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element for TTS playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          className="hidden"
        />
      )}
    </div>
  )
}

export default App