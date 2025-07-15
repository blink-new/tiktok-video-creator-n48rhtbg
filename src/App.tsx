import { useState, useRef, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Input } from './components/ui/input'
import { Textarea } from './components/ui/textarea'
import { Slider } from './components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Badge } from './components/ui/badge'
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
  EyeOff
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

function App() {
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoDuration] = useState(15) // 15 seconds default
  const [background, setBackground] = useState(BACKGROUND_OPTIONS[0])
  const [newText, setNewText] = useState('')
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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

  const selectedElementData = textElements.find(el => el.id === selectedElement)

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const resetPlayback = () => {
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const exportVideo = () => {
    // Placeholder for video export functionality
    alert('Video export functionality would be implemented here!')
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
            {/* Add Text */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Add Text
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
                style={{ background: background.style }}
              >
                {/* Text Elements */}
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
                <span>{currentTime.toFixed(1)}s / {videoDuration}s</span>
              </div>
              <Badge variant="secondary">
                {textElements.length} text element{textElements.length !== 1 ? 's' : ''}
              </Badge>
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
                <span>{videoDuration}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App