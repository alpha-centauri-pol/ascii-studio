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
  ChevronDown,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

const DEMO_IMAGES = [
  { id: 1, url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', label: 'Cyberpunk' },
  { id: 2, url: 'https://images.unsplash.com/photo-1531297172864-45d1b5590390?w=800&q=80', label: 'Tech' },
  { id: 3, url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', label: 'Space' },
  { id: 4, url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', label: 'Abstract' }
];

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
  const [imageSrc, setImageSrc] = useState(null);
  const [mode, setMode] = useState('video'); // 'video', 'webcam', 'image'
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Config
  const [config, setConfig] = useState({
    shapeType: 'ASCII', // ASCII, Dots, Braille, Lego, Pixel, Mosaic, 3D
    baseSize: 10,       
    sizeVariation: true,
    minSize: 6,
    maxSize: 14,
    density: 0.95,
    coverage: 85,
    edgeEmphasis: 60,
    brightness: 0,
    contrast: 0,
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
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);

      stopWebcam();
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (imageSrc) URL.revokeObjectURL(imageSrc);

      if (isVideo) {
        setVideoSrc(url);
        setImageSrc(null);
        setMode('video');
        setIsPlaying(true);
        if (videoRef.current) {
          videoRef.current.src = url;
          videoRef.current.load();
          videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
        }
      } else {
        setImageSrc(url);
        setVideoSrc(null);
        setMode('image');
        setIsPlaying(false);
        // We will process the frame once the image loads
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
    const image = imageRef.current;
    const canvas = canvasRef.current;
    
    if (!canvas) return;

    let source = null;
    let w = 0;
    let h = 0;

    if (mode === 'video' || mode === 'webcam') {
      if (!video) return;
      if (mode === 'video' && video.ended) {
        setIsPlaying(false);
        return;
      }
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }
      source = video;
      w = video.videoWidth;
      h = video.videoHeight;
    } else if (mode === 'image') {
      if (!image || !image.complete || image.naturalWidth === 0) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }
      source = image;
      w = image.naturalWidth;
      h = image.naturalHeight;
    }

    if (!source) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { colors, bg } = COLOR_PALETTES[config.paletteName];
    
    // Low density = larger steps (faster)
    const stepSize = Math.max(4, Math.floor(20 * (1 - config.density) + 4)); 
    
    // Scale Logic
    const MAX_PROC_WIDTH = 640; 
    let scale = 1;
    if (w > MAX_PROC_WIDTH) scale = MAX_PROC_WIDTH / w;

    if (canvas.width !== w * scale) {
        canvas.width = w * scale;
        canvas.height = h * scale;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tempCtx.drawImage(source, 0, 0, tempCanvas.width, tempCanvas.height);
    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imgData.data;

    // Edge Detection Map (Sobel)
    const edgeData = new Float32Array(canvas.width * canvas.height);
    if (config.edgeEmphasis > 0) {
      const gray = new Float32Array(canvas.width * canvas.height);
      for (let i = 0; i < canvas.width * canvas.height; i++) {
        const idx = i * 4;
        gray[i] = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
      }
      let maxEdge = 0;
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = y * canvas.width + x;
          const gx = -gray[(y-1)*canvas.width + (x-1)] + gray[(y-1)*canvas.width + (x+1)]
                     -2*gray[y*canvas.width + (x-1)] + 2*gray[y*canvas.width + (x+1)]
                     -gray[(y+1)*canvas.width + (x-1)] + gray[(y+1)*canvas.width + (x+1)];
          const gy = -gray[(y-1)*canvas.width + (x-1)] - 2*gray[(y-1)*canvas.width + x] - gray[(y-1)*canvas.width + (x+1)]
                     +gray[(y+1)*canvas.width + (x-1)] + 2*gray[(y+1)*canvas.width + x] + gray[(y+1)*canvas.width + (x+1)];
          const mag = Math.sqrt(gx * gx + gy * gy);
          edgeData[idx] = mag;
          if (mag > maxEdge) maxEdge = mag;
        }
      }
      if (maxEdge > 0) {
        for (let i = 0; i < edgeData.length; i++) edgeData[i] /= maxEdge;
      }
    }

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
        
        // Coverage & Edge Logic
        const edgeVal = edgeData[Math.floor(y) * canvas.width + Math.floor(x)] || 0;
        const edgeBoost = Math.pow(edgeVal, 0.4) * (config.edgeEmphasis / 100);
        const normLum = lum / 255;
        const visibility = Math.min(1, normLum + edgeBoost);
        const threshold = 1 - (config.coverage / 100);
        
        if (visibility < threshold) continue;

        // Apply Brightness/Contrast to Color
        const contrastFactor = (259 * (config.contrast + 255)) / (255 * (259 - config.contrast));
        const adjR = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128 + (config.brightness / 100) * 255));
        const adjG = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128 + (config.brightness / 100) * 255));
        const adjB = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128 + (config.brightness / 100) * 255));
        const adjLum = getLuminance(adjR, adjG, adjB);

        const color = getColorForLuminance(adjLum, colors);
        ctx.fillStyle = color;

        if (config.shapeType === 'ASCII' || config.shapeType === 'Blocks') {
            let activeSet = charSet;
            if (config.shapeType === 'Blocks') activeSet = ' ░▒▓█';
            const len = activeSet.length;
            let charIndex = Math.floor((adjLum / 255) * (len - 1));
            if(charIndex < 0) charIndex = 0;
            if(charIndex >= len) charIndex = len - 1;

            const char = activeSet[charIndex];
            if (char === ' ') continue;

            let fontSize = config.baseSize;
            if (config.sizeVariation) {
                const sizeRange = config.maxSize - config.minSize;
                const sizeOffset = (adjLum / 255) * sizeRange;
                fontSize = config.minSize + sizeOffset;
            }

            ctx.font = `${fontSize}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char, x + stepSize/2, y + stepSize/2);

        } else if (config.shapeType === 'Dots') {
            const maxRadius = stepSize / 2;
            let radius = maxRadius * 0.8;
            if (config.sizeVariation) radius = (adjLum / 255) * maxRadius;
            
            ctx.beginPath();
            ctx.arc(x + stepSize/2, y + stepSize/2, Math.max(0.5, radius), 0, Math.PI * 2);
            ctx.fill();
        } else if (config.shapeType === 'Braille') {
            let brailleCode = 0;
            const bitMap = [0, 1, 2, 6, 3, 4, 5, 7];
            for (let dc = 0; dc < 2; dc++) {
              for (let dr = 0; dr < 4; dr++) {
                const subX = Math.floor(x + (dc + 0.5) * (stepSize / 2));
                const subY = Math.floor(y + (dr + 0.5) * (stepSize / 4));
                if (subX >= canvas.width || subY >= canvas.height) continue;
                const pi = (subY * canvas.width + subX) * 4;
                const sl = getLuminance(pixels[pi], pixels[pi+1], pixels[pi+2]);
                if ((sl / 255) > 0.45) brailleCode |= (1 << bitMap[dc * 4 + dr]);
              }
            }
            if (brailleCode !== 0) {
              const char = String.fromCharCode(0x2800 + brailleCode);
              ctx.font = `${config.baseSize}px monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(char, x + stepSize/2, y + stepSize/2);
            }
        } else if (config.shapeType === 'Pixel') {
            const inset = 0.5;
            const size = stepSize - inset * 2;
            ctx.fillRect(x + inset, y + inset, size, size);
        } else if (config.shapeType === 'Lego') {
            const size = stepSize;
            ctx.fillRect(x, y, size, size);
            
            ctx.fillStyle = `rgba(0,0,0,0.25)`;
            ctx.beginPath();
            ctx.arc(x + size/2 + size*0.04, y + size/2 + size*0.06, size*0.35, 0, Math.PI * 2);
            ctx.fill();

            const c1 = hexToRgb(color);
            ctx.fillStyle = `rgb(${Math.min(255, c1.r+20)}, ${Math.min(255, c1.g+20)}, ${Math.min(255, c1.b+20)})`;
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size*0.35, 0, Math.PI * 2);
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
      <img ref={imageRef} crossOrigin="anonymous" className="hidden" onLoad={() => {
         if (mode === 'image') processFrame();
      }} />

      {/* --- Sidebar (Control Deck) --- */}
      {/* LAYOUT LOGIC:
          Mobile: order-2 (appears at bottom), h-full (scrollable)
          Desktop: order-1 (appears at left), w-96 (fixed width)
      */}
      <div className="order-2 lg:order-1 flex-1 lg:flex-none w-full lg:w-96 bg-black border-t lg:border-t-0 lg:border-r border-zinc-800 flex flex-col h-full z-20 overflow-y-auto custom-scrollbar">
        
        {/* Brand Header */}
        <div className="p-8 pb-6 border-b border-zinc-900">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-8 h-8 bg-white flex items-center justify-center">
                <Settings className="text-black" size={20} strokeWidth={3} />
             </div>
             <h1 className="text-3xl font-['Instrument_Serif'] uppercase text-white leading-none pt-1 tracking-wide">ASCII<span className="text-zinc-600">.STUDIO</span></h1>
          </div>
          <p className="text-zinc-500 text-xs font-['Inter'] font-bold uppercase tracking-[0.2em] mt-2">Realtime Synthesis Engine</p>
        </div>

        <div className="flex-1 p-6 space-y-6 pb-20 lg:pb-6">
            
            {/* 0. Demos */}
            <CredCard title="Reference Archives" rightAction={<Sparkles size={14} className="text-zinc-500" />}>
               <div className="grid grid-cols-2 gap-2">
                 {DEMO_IMAGES.map((demo) => (
                   <button
                     key={demo.id}
                     onClick={() => {
                        stopWebcam();
                        if (videoSrc) URL.revokeObjectURL(videoSrc);
                        setImageSrc(demo.url);
                        setVideoSrc(null);
                        setMode('image');
                        setIsPlaying(false);
                        if (imageRef.current) {
                           imageRef.current.src = demo.url;
                        }
                     }}
                     className="relative group h-20 overflow-hidden border border-zinc-800 hover:border-zinc-500 transition-colors"
                   >
                     <img src={demo.url} alt={demo.label} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                     <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors" />
                     <span className="absolute bottom-1 left-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">{demo.label}</span>
                   </button>
                 ))}
               </div>
            </CredCard>

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
               <input type="file" ref={fileInputRef} onChange={handleVideoUpload} className="hidden" accept="video/*,image/*" />
               
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
               <CredSelect 
                  label="Morphology Options"
                  value={config.shapeType} 
                  onChange={(e) => setConfig({...config, shapeType: e.target.value})}
                  options={['ASCII', 'Blocks', 'Dots', 'Braille', 'Pixel', 'Lego']}
               />

               {(config.shapeType === 'ASCII' || config.shapeType === 'Blocks') && (
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
                 <CredSlider label="Signal Density" value={config.coverage} min={10} max={100} suffix="%" onChange={(v)=>setConfig({...config, coverage: v})} />
                 <CredSlider label="Outline Extraction" value={config.edgeEmphasis} min={0} max={100} suffix="%" onChange={(v)=>setConfig({...config, edgeEmphasis: v})} />
                 <CredSlider label="Exposure" value={config.brightness} min={-100} max={100} onChange={(v)=>setConfig({...config, brightness: v})} />
                 <CredSlider label="Dynamic Range" value={config.contrast} min={-100} max={100} onChange={(v)=>setConfig({...config, contrast: v})} />
                 
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
      {/* LAYOUT LOGIC:
          Mobile: order-1 (appears at top), h-[40vh] (fixed 40% height)
          Desktop: order-2 (appears at right), h-auto (flexes to fill)
      */}
      <div className="order-1 lg:order-2 h-[40vh] lg:h-auto lg:flex-1 bg-black relative overflow-hidden flex items-center justify-center p-2 lg:p-12 border-b lg:border-b-0 border-zinc-800">
        
        {/* Background Grid for technical feel */}
        <div className="absolute inset-0 pointer-events-none opacity-10" 
             style={{ 
                 backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                 backgroundSize: '40px 40px' 
             }} 
        />
        
        {/* Placeholder */}
        {!videoSrc && mode !== 'webcam' && (
             <div className="z-10 flex flex-col items-center justify-center text-zinc-600 border border-zinc-800 p-6 lg:p-12 bg-zinc-900/50 backdrop-blur-sm max-w-md text-center">
                 <Monitor size={48} lg:size={64} strokeWidth={1} className="mb-4 lg:mb-6 opacity-50" />
                 <h3 className="text-xl lg:text-3xl font-['Instrument_Serif'] uppercase text-zinc-300 mb-2 tracking-wide">No Signal</h3>
                 <p className="text-xs font-['Inter'] font-bold uppercase tracking-widest text-zinc-500 mb-6 lg:mb-8">Initialize Source to Begin Synthesis</p>
                 <CredButton onClick={() => fileInputRef.current.click()} className="min-w-[160px] lg:min-w-[200px]">UPLOAD FOOTAGE</CredButton>
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
            <canvas ref={canvasRef} className="block max-w-full max-h-full" />
        </div>

        {/* Metadata Overlay */}
        {(videoSrc || mode === 'webcam') && (
            <div className="absolute top-4 right-4 lg:top-6 lg:right-6 flex flex-col items-end gap-1 pointer-events-none">
                <div className="flex items-center gap-2">
                    {isRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">
                        {isRecording ? 'REC' : 'LIVE'} // {config.shapeType}
                    </span>
                </div>
                <div className="text-[10px] lg:text-xs font-mono text-zinc-700 uppercase">
                    REZ: {Math.round(config.density * 100)}% / PALETTE: {config.paletteName.toUpperCase()}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}