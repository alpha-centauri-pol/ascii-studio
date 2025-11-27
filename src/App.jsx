import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Video, 
  Camera, 
  Settings, 
  Play, 
  Pause, 
  Disc, 
  StopCircle, 
  Shuffle, 
  Monitor, 
  Aperture,
  Grid,
  Type,
  Maximize2,
  ChevronDown
} from 'lucide-react';

// --- Constants & Config ---

const ASCII_SETS = {
  'Standard': ' .`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  'Steps': ' .:-=+*#%@',
  'Blocks': ' ░▒▓█',
  'Binary': ' 01',
  'Matrix': ' ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ1234567890',
  'Solid': ' █',
  'Smileys': '  ☻☺',
};

const COLOR_PALETTES = {
  'Matrix': {
    colors: ['#000000', '#003300', '#00ff00', '#ffffff'],
    bg: '#000500'
  },
  'Grayscale': {
    colors: ['#000000', '#333333', '#888888', '#ffffff'],
    bg: '#050505'
  },
  'Synthwave': { 
    colors: ['#140033', '#3b0066', '#8b00a3', '#00d4ff', '#ffffff'],
    bg: '#0a001a'
  },
  'Thermal': { 
    colors: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000'],
    bg: '#000000'
  },
  'Warm Contrast': { 
    colors: ['#2b1100', '#6b2200', '#c75d00', '#ffb700', '#ffffff'],
    bg: '#1a0a00'
  },
  'Sunset': { 
    colors: ['#0f0f2e', '#2e2e5e', '#7e4e5e', '#ce6e4e', '#fe9e3e', '#ffffff'],
    bg: '#05051a'
  },
  'Cool Vintage': { 
    colors: ['#002b36', '#073642', '#586e75', '#839496', '#eee8d5', '#fdf6e3'],
    bg: '#001e26'
  },
  'Cream': {
    colors: ['#2f2f2f', '#a0a0a0', '#e0e0e0', '#ffffff'],
    bg: '#f0f0f0' 
  }
};

// --- Helper Functions ---

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const getLuminance = (r, g, b) => {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getColorForLuminance = (luminance, colors) => {
  const t = luminance / 255;
  const colorCount = colors.length;
  
  if (colorCount === 0) return 'rgb(255,255,255)';
  if (colorCount === 1) return colors[0];

  const scaledT = t * (colorCount - 1);
  const index = Math.floor(scaledT);
  const remainder = scaledT - index;

  if (index >= colorCount - 1) return colors[colorCount - 1];

  const c1 = hexToRgb(colors[index]);
  const c2 = hexToRgb(colors[index + 1]);

  const r = Math.round(c1.r + (c2.r - c1.r) * remainder);
  const g = Math.round(c1.g + (c2.g - c1.g) * remainder);
  const b = Math.round(c1.b + (c2.b - c1.b) * remainder);

  return `rgb(${r},${g},${b})`;
};

// --- Styled Components (Strict Standardization) ---

const CredCard = ({ children, title, className = "", rightAction }) => (
  <div className={`bg-zinc-900 border border-zinc-800 p-6 flex flex-col gap-5 ${className}`}>
    {(title || rightAction) && (
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-1">
        {title && <h3 className="text-xl font-['Instrument_Serif'] uppercase text-zinc-300 tracking-wide">{title}</h3>}
        {rightAction}
      </div>
    )}
    {children}
  </div>
);

const CredButton = ({ children, onClick, active, variant = "primary", className = "", icon: Icon }) => {
  const baseStyle = "h-12 px-6 flex items-center justify-center gap-3 font-['Inter'] font-bold text-sm tracking-wider uppercase transition-all duration-200 border";
  
  const variants = {
    primary: active 
      ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
      : "bg-black text-white border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900",
    danger: active
      ? "bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
      : "bg-black text-red-500 border-zinc-800 hover:border-red-900 hover:bg-red-950/20",
    ghost: "bg-transparent border-transparent text-zinc-400 hover:text-white px-2 h-auto"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} strokeWidth={2.5} />}
      {children}
    </button>
  );
};

const CredSlider = ({ label, value, min, max, onChange, suffix = '' }) => (
  <div className="flex flex-col gap-3">
    <div className="flex justify-between items-end">
      <label className="text-xs font-['Inter'] font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
      <span className="text-xs font-mono text-white bg-zinc-800 px-2 py-1 rounded">{Math.round(value)}{suffix}</span>
    </div>
    <div className="relative h-6 flex items-center group cursor-pointer">
      <input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="w-full h-1 bg-zinc-800 overflow-hidden relative">
        <div 
          className="h-full bg-white transition-all duration-75 ease-out" 
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
      <div 
        className="w-3 h-3 bg-white absolute pointer-events-none transition-all duration-75 ease-out shadow-lg"
        style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
      />
    </div>
  </div>
);

const CredSelect = ({ value, onChange, options, label }) => (
  <div className="flex flex-col gap-3">
    {label && <label className="text-xs font-['Inter'] font-bold text-zinc-500 uppercase tracking-wider">{label}</label>}
    <div className="relative">
      <select 
        value={value}
        onChange={onChange}
        className="w-full h-12 bg-black border border-zinc-700 text-white font-['Inter'] text-sm font-bold uppercase px-4 appearance-none focus:outline-none focus:border-white transition-colors cursor-pointer tracking-wide"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  // State
  const [videoSrc, setVideoSrc] = useState(null);
  const [mode, setMode] = useState('video'); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Config
  const [config, setConfig] = useState({
    shapeType: 'ASCII', 
    baseSize: 10,       
    sizeVariation: true,
    minSize: 6,
    maxSize: 14,
    density: 0.5,       
    asciiSet: 'Standard',
    zoom: 100,
    paletteName: 'Matrix', 
  });

  // Cleanup
  useEffect(() => {
    return () => {
      stopAnimation();
      if (videoSrc && mode === 'video') URL.revokeObjectURL(videoSrc);
    };
  }, []);

  // Handlers
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      stopWebcam();
      
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setMode('video');
      setIsPlaying(true);
      
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
        videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
      }
    }
  };

  const startWebcam = async () => {
    try {
      stopWebcam();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setVideoSrc(null);
      setMode('webcam');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access webcam.");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Render Loop
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.paused || video.ended) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { colors, bg } = COLOR_PALETTES[config.paletteName];
    
    // Low density = larger steps (faster)
    const stepSize = Math.max(4, Math.floor(20 * (1 - config.density) + 4)); 
    
    const w = video.videoWidth;
    const h = video.videoHeight;
    
    if (w === 0 || h === 0) return;

    // Scale Logic
    const MAX_PROC_WIDTH = 640; 
    let scale = 1;
    if (w > MAX_PROC_WIDTH) scale = MAX_PROC_WIDTH / w;

    if (canvas.width !== w * scale) {
        canvas.width = w * scale;
        canvas.height = h * scale;
    }

    // Capture Frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imgData.data;

    // Draw
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const charSet = ASCII_SETS[config.asciiSet];
    const charLen = charSet.length;

    for (let y = 0; y < canvas.height; y += stepSize) {
      for (let x = 0; x < canvas.width; x += stepSize) {
        
        const pixelIndex = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        
        const lum = getLuminance(r, g, b);
        const color = getColorForLuminance(lum, colors);

        ctx.fillStyle = color;

        if (config.shapeType === 'ASCII') {
            let charIndex = Math.floor((lum / 255) * (charLen - 1));
            if(charIndex < 0) charIndex = 0;
            if(charIndex >= charLen) charIndex = charLen - 1;

            const char = charSet[charIndex];
            if (char === ' ') continue;

            let fontSize = config.baseSize;
            if (config.sizeVariation) {
                const sizeRange = config.maxSize - config.minSize;
                const sizeOffset = (lum / 255) * sizeRange;
                fontSize = config.minSize + sizeOffset;
            }

            ctx.font = `${fontSize}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char, x + stepSize/2, y + stepSize/2);

        } else if (config.shapeType === 'Dots') {
            const maxRadius = stepSize / 2;
            let radius = maxRadius * 0.8;
            if (config.sizeVariation) radius = (lum / 255) * maxRadius;
            
            ctx.beginPath();
            ctx.arc(x + stepSize/2, y + stepSize/2, Math.max(0, radius), 0, Math.PI * 2);
            ctx.fill();
        }
      }
    }

    animationRef.current = requestAnimationFrame(processFrame);
  }, [config]);

  // Playback Effect
  useEffect(() => {
    if (isPlaying) {
      videoRef.current?.play().catch(() => {});
      animationRef.current = requestAnimationFrame(processFrame);
    } else {
      videoRef.current?.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, processFrame]);

  const stopAnimation = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ascii-video-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = mediaRecorder;
    }
  };

  const randomizeSettings = () => {
    const paletteKeys = Object.keys(COLOR_PALETTES);
    const randomPalette = paletteKeys[Math.floor(Math.random() * paletteKeys.length)];

    setConfig(prev => ({
        ...prev,
        asciiSet: Object.keys(ASCII_SETS)[Math.floor(Math.random() * Object.keys(ASCII_SETS).length)],
        paletteName: randomPalette,
        density: 0.3 + Math.random() * 0.4, 
        baseSize: 8 + Math.floor(Math.random() * 8),
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black text-gray-100 font-sans overflow-hidden select-none">
      
      {/* Font Imports */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:wght@400&family=Inter:wght@500;700&display=swap');
        `}
      </style>

      {/* Hidden Video Source */}
      <video ref={videoRef} playsInline loop muted className="hidden" onPlay={() => setIsPlaying(true)} />

      {/* --- Sidebar (Control Deck) --- */}
      <div className="w-full lg:w-96 bg-black border-r border-zinc-800 flex flex-col h-full z-20 overflow-y-auto custom-scrollbar">
        
        {/* Brand Header */}
        <div className="p-8 pb-6 border-b border-zinc-900">
          <div className="flex items-center gap-3 mb-3">
             <h1 className="text-3xl font-['Instrument_Serif'] uppercase text-white leading-none pt-1 tracking-wide">ASCII<span className="text-zinc-600">.STUDIO</span></h1>
          </div>
          <p className="text-zinc-500 text-xs font-['Inter'] font-bold uppercase tracking-[0.2em] mt-2">Realtime Synthesis Engine</p>
        </div>

        <div className="flex-1 p-6 space-y-6">
            
            {/* 1. Input Source */}
            <CredCard title="Input Feed">
               <div className="grid grid-cols-2 gap-3">
                  <CredButton 
                    variant={mode === 'video' ? 'primary' : 'primary'} 
                    active={mode === 'video'}
                    onClick={() => { stopWebcam(); fileInputRef.current.click(); }}
                    icon={Video}
                  >
                    UPLOAD
                  </CredButton>
                  <CredButton 
                    variant={mode === 'webcam' ? 'primary' : 'primary'}
                    active={mode === 'webcam'}
                    onClick={startWebcam}
                    icon={Camera}
                  >
                    CAMERA
                  </CredButton>
               </div>
               <input type="file" ref={fileInputRef} onChange={handleVideoUpload} className="hidden" accept="video/*" />
               
               {/* Transport Controls */}
               <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                  <CredButton 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-full"
                    icon={isPlaying ? Pause : Play}
                  >
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                  </CredButton>
                  <CredButton 
                    variant="danger"
                    active={isRecording}
                    onClick={toggleRecording}
                    icon={isRecording ? StopCircle : Disc}
                  >
                    {isRecording ? 'STOP' : 'REC'}
                  </CredButton>
               </div>
            </CredCard>

            {/* 2. Visual Style */}
            <CredCard title="Visual Syntax">
               <div className="grid grid-cols-2 gap-3 mb-4">
                   <button 
                      onClick={() => setConfig({...config, shapeType: 'ASCII'})}
                      className={`h-24 border flex flex-col items-center justify-center gap-2 transition-all ${config.shapeType === 'ASCII' ? 'bg-white text-black border-white' : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                   >
                      <Type size={24} />
                      <span className="text-xs font-['Inter'] font-bold tracking-widest uppercase">Char</span>
                   </button>
                   <button 
                      onClick={() => setConfig({...config, shapeType: 'Dots'})}
                      className={`h-24 border flex flex-col items-center justify-center gap-2 transition-all ${config.shapeType === 'Dots' ? 'bg-white text-black border-white' : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                   >
                      <Grid size={24} />
                      <span className="text-xs font-['Inter'] font-bold tracking-widest uppercase">Dot</span>
                   </button>
               </div>

               {config.shapeType === 'ASCII' && (
                 <CredSelect 
                    label="Character Set"
                    value={config.asciiSet} 
                    onChange={(e) => setConfig({...config, asciiSet: e.target.value})}
                    options={Object.keys(ASCII_SETS)}
                 />
               )}
            </CredCard>

            {/* 3. Parameters */}
            <CredCard title="Parameters" rightAction={
               <button onClick={randomizeSettings} className="text-zinc-500 hover:text-white transition-colors">
                  <Shuffle size={14} />
               </button>
            }>
               <div className="space-y-6 pt-2">
                 <CredSlider label="Resolution Density" value={config.density} min={0.1} max={0.95} onChange={(v)=>setConfig({...config, density: v})} />
                 <CredSlider label="Base Element Size" value={config.baseSize} min={4} max={40} suffix="px" onChange={(v)=>setConfig({...config, baseSize: v})} />
                 
                 <div className="flex items-center justify-between py-1">
                     <span className="text-xs font-['Inter'] font-bold text-zinc-500 uppercase tracking-wider">Luminance Scaling</span>
                     <button 
                        onClick={() => setConfig({...config, sizeVariation: !config.sizeVariation})}
                        className={`w-10 h-5 border transition-all ${config.sizeVariation ? 'bg-white border-white' : 'bg-black border-zinc-700'}`}
                     >
                        <div className={`w-3 h-3 transition-all ${config.sizeVariation ? 'bg-black translate-x-5' : 'bg-zinc-500 translate-x-1'}`} />
                     </button>
                 </div>
               </div>
            </CredCard>

            {/* 4. Color */}
            <CredCard title="Color Grade">
                <CredSelect 
                    value={config.paletteName}
                    onChange={(e) => setConfig({...config, paletteName: e.target.value})}
                    options={Object.keys(COLOR_PALETTES)}
                 />
                 <div className="h-4 flex w-full mt-3 border border-zinc-800">
                    {COLOR_PALETTES[config.paletteName].colors.map((c, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))}
                 </div>
            </CredCard>

             {/* 5. View */}
            <CredCard>
               <div className="flex items-center gap-4">
                  <Maximize2 size={16} className="text-zinc-500" />
                  <div className="flex-1">
                     <CredSlider label="Viewport Zoom" value={config.zoom} min={25} max={200} suffix="%" onChange={(v)=>setConfig({...config, zoom: v})} />
                  </div>
               </div>
            </CredCard>
            
            <div className="h-8"></div>
        </div>
      </div>

      {/* --- Main Viewport --- */}
      <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center p-8 lg:p-12">
        
        {/* Background Grid for technical feel */}
        <div className="absolute inset-0 pointer-events-none opacity-10" 
             style={{ 
                 backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                 backgroundSize: '40px 40px' 
             }} 
        />
        
        {/* Placeholder */}
        {!videoSrc && mode !== 'webcam' && (
             <div className="z-10 flex flex-col items-center justify-center text-zinc-600 border border-zinc-800 p-12 bg-zinc-900/50 backdrop-blur-sm max-w-md text-center">
                 <Monitor size={64} strokeWidth={1} className="mb-6 opacity-50" />
                 <h3 className="text-3xl font-['Instrument_Serif'] uppercase text-zinc-300 mb-2 tracking-wide">No Signal</h3>
                 <p className
                 ="text-xs font-['Inter'] font-bold uppercase tracking-widest text-zinc-500 mb-8">Initialize Source to Begin Synthesis</p>
                 <CredButton onClick={() => fileInputRef.current.click()} className="min-w-[200px]">UPLOAD FOOTAGE</CredButton>
             </div>
        )}

        {/* The Canvas */}
        <div 
            ref={containerRef}
            className={`transition-transform duration-200 ease-out origin-center shadow-2xl ${(!videoSrc && mode !== 'webcam') ? 'hidden' : 'block'}`}
            style={{ 
                transform: `scale(${config.zoom / 100})`,
                boxShadow: '0 0 100px -20px rgba(0,0,0,0.8)'
            }}
        >
            <canvas ref={canvasRef} className="block" />
        </div>

        {/* Metadata Overlay */}
        {(videoSrc || mode === 'webcam') && (
            <div className="absolute top-6 right-6 flex flex-col items-end gap-1 pointer-events-none">
                <div className="flex items-center gap-2">
                    {isRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">
                        {isRecording ? 'REC' : 'LIVE'} // {config.shapeType}
                    </span>
                </div>
                <div className="text-xs font-mono text-zinc-700 uppercase">
                    REZ: {Math.round(config.density * 100)}% / PALETTE: {config.paletteName.toUpperCase()}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}