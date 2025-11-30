import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./hooks/useAuth";
import { useGameEngine } from "./hooks/useGameEngine";
import { registerUsername } from "./hooks/supabaseUtils"; 

import type { Task, ParcelaObject, ViewTransform, StoreItem, Toast } from './types';
import {
  ShoppingCart, ListTodo, Settings, DollarSign, BarChart4, X, Plus, Zap, Heart, Cat, Home,
  Sparkles, Pencil, AlertTriangle, Info, ThumbsUp, Trash2, Clock, User, LogOut, Calendar,
  Activity, Star, HelpCircle, Mail, ChevronUp, Upload, Image as ImageIcon, Loader2,
} from "lucide-react";

// --- IMÁGENES ---
import parcelaImg from './assets/parcela.png';
import baseImg from './assets/base.png';
import trabajandoImg from './assets/trabajando.png';
import trabajando2Img from './assets/trabajando2.png';
import descansoImg from './assets/descanso.png';
import descanso2Img from './assets/descanso2.png';
import perroImg from './assets/perro.png';
import gatoImg from './assets/gato.png';
import casaImg from './assets/casa.png';

// --- UTILIDADES ---
function hexToRgb(hex: string): string {
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
  const expandedHex = cleanHex.length === 3 ? cleanHex.split("").map((char: string) => char + char).join("") : cleanHex;
  const bigint = parseInt(expandedHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const result = event.target?.result as string | null;
      if (!result) return reject(new Error('No file data'));
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; 
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Cannot get canvas context'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const getDistance = (touches: any): number => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
const getMidpoint = (touches: any) => ({ x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 });

function App() {
  const { currentUser, authLoading, loginError, login, signup, logout, setLoginError } = useAuth();
  
  const { 
    coins, parcelaObjects, tasks, username, theme, 
    isDataLoaded, isSaving, showUsernameModal, setShowUsernameModal, saveUsername, saveTheme,
    buyItem, setParcelaObjects, objectsRef, smartSave, 
    completeTask, saveNewTask, updateTaskStatus, resetTasks, switchActiveTask // <--- IMPORTANTE
  } = useGameEngine(currentUser);

  // UI States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [signupPrompt, setSignupPrompt] = useState(false);
  
  const [storeDrawerOpen, setStoreDrawerOpen] = useState(false);
  const [activitiesDrawerOpen, setActivitiesDrawerOpen] = useState(false);
  const [configDropdownOpen, setConfigDropdownOpen] = useState(false);
  const [tycoonPanelOpen, setTycoonPanelOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isBannerExpanded, setIsBannerExpanded] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  
  const [desiredUsername, setDesiredUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [previewImageSrc, setPreviewImageSrc] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationState, setAnimationState] = useState("idle");
  const [lumberjackFrame, setLumberjackFrame] = useState(0);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // --- ESTADOS NUEVOS ---
  const [restEndTime, setRestEndTime] = useState<number | null>(null);
  const taskStartTimes = useRef<{ [key: number]: number }>({}); 
  const clickCounterRef = useRef<{ id: number, count: number, lastTime: number }>({ id: 0, count: 0, lastTime: 0 });

  // Drag & Zoom
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedObjectId, setDraggedObjectId] = useState<string | number | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const parcelaRef = useRef<HTMLDivElement | null>(null);
  const [viewTransform, setViewTransform] = useState<ViewTransform>({ x: -400, y: -200, scale: 1 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTouchRef = useRef<{ distance: number | null; x: number; y: number }>({ distance: null, x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [taskToCompleteId, setTaskToCompleteId] = useState<number | null>(null);
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);
  const [toast, setToast] = useState<Toast>({ message: "", visible: false, type: "success" });

  const isAnyMenuOpen = storeDrawerOpen || activitiesDrawerOpen || tycoonPanelOpen || isContactOpen || isAddTaskModalOpen;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { changeThemeColor(theme, false); }, [theme]);

  // --- CEREBRO DE ANIMACIONES ---
  useEffect(() => {
    const activeTask = tasks.find(t => t.inProgress && !t.archived);

    if (activeTask) {
      setActiveTaskId(activeTask.id);
      setAnimationState('chopping');
      setRestEndTime(null); 
    } else {
      setActiveTaskId(null);
      if (restEndTime && Date.now() < restEndTime) {
        setAnimationState('sitting');
        const remainingTime = restEndTime - Date.now();
        const timer = setTimeout(() => { setRestEndTime(null); }, remainingTime);
        return () => clearTimeout(timer);
      } else {
        setAnimationState('idle');
      }
    }
  }, [tasks, restEndTime]);

  useEffect(() => {
      let interval: number | undefined;
      if (animationState === "chopping") interval = window.setInterval(() => setLumberjackFrame(p => (p + 1) % 2), 300) as unknown as number;
      else if (animationState === "sitting") interval = window.setInterval(() => setLumberjackFrame(p => (p + 1) % 2), 500) as unknown as number;
      else setLumberjackFrame(0);
      return () => { if (interval !== undefined) window.clearInterval(interval); };
  }, [animationState]);

  const showToast = useCallback((message: string, type: any = "success") => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4000);
  }, []);

  const closeAllMenus = () => { setConfigDropdownOpen(false); setTycoonPanelOpen(false); setIsContactOpen(false); setIsBannerExpanded(false); };
  const toggleStoreDrawer = () => { closeAllMenus(); setStoreDrawerOpen(!storeDrawerOpen); };
  const toggleActivitiesDrawer = () => { closeAllMenus(); setActivitiesDrawerOpen(!activitiesDrawerOpen); };
  const toggleConfig = () => { closeAllMenus(); setStoreDrawerOpen(false); setActivitiesDrawerOpen(false); setConfigDropdownOpen(!configDropdownOpen); };
  const toggleTycoonPanel = () => { closeAllMenus(); setStoreDrawerOpen(false); setActivitiesDrawerOpen(false); setTycoonPanelOpen(!tycoonPanelOpen); };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = await login(email.trim(), password);
    if (success) { setEmail(""); setPassword(""); showToast('Sesión iniciada', 'success'); }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const success = await signup(email.trim(), password);
    if (success) { setEmail(""); setPassword(""); showToast('Cuenta creada', 'success'); }
  };

  const handleLogout = async () => { if (confirm("¿Cerrar sesión?")) await logout(); };

  const handleUsernameSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    const val = desiredUsername.trim().toLowerCase();
    setUsernameChecking(true);
    try {
      await registerUsername(val, currentUser);
      saveUsername(val);
      setShowUsernameModal(false);
      showToast('Nombre guardado', 'success');
    } catch (err: any) { setUsernameError(err.message || 'Error'); } finally { setUsernameChecking(false); }
  };

  const handleBuyItem = (item: StoreItem) => {
    if (isAnimating) return;
    const success = buyItem(item);
    if (success) showToast("Comprado", "success"); else showToast("Faltan monedas", "error");
  };

  const removeParcelaObject = (id: string | number) => {
    const newObjects = parcelaObjects.filter(o => o.id !== id);
    setParcelaObjects(newObjects); 
    smartSave({ objects: newObjects });
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const target = e.currentTarget as any;
      saveNewTask({ 
        id: Date.now(), name: target.taskName.value, reward: parseInt(target.taskReward.value), 
        deadline: target.taskDeadline.value || null, completed: false, inProgress: false, proofImage: null, archived: false 
      });
      setIsAddTaskModalOpen(false);
  };

  // --- BOTÓN INICIAR (UN SOLO CLICK) ---
  const handleStartTask = (id: number) => {
      // VALIDACIÓN: No permite iniciar si ya hay otra activa
      const isAnyTaskActive = tasks.some(t => t.inProgress && !t.archived);
      if (isAnyTaskActive) { showToast("¡Termina tu tarea actual primero!", "error"); return; }

      taskStartTimes.current[id] = Date.now();
      setRestEndTime(null);
      updateTaskStatus(id, true); 
  };

  // --- LÓGICA DE 5 CLICKS: CAMBIO FORZADO ---
  const handleTaskCardClick = (task: Task) => {
    if (task.completed || task.archived) return;
    if (task.inProgress) return; // Si ya es la activa, no hacemos nada

    const now = Date.now();
    // Detectar clicks rápidos (< 500ms)
    if (clickCounterRef.current.id === task.id && now - clickCounterRef.current.lastTime < 500) {
      clickCounterRef.current.count++;
    } else {
      clickCounterRef.current = { id: task.id, count: 1, lastTime: now };
    }
    clickCounterRef.current.lastTime = now;

    // ¡5 CLICKS DETECTADOS! -> EJECUTAR CAMBIO
    if (clickCounterRef.current.count >= 5) {
      setIsAnimating(true); 
      
      // 1. Guardamos la hora de inicio de la NUEVA tarea
      taskStartTimes.current[task.id] = Date.now();
      
      // 2. Cancelamos cualquier descanso si había
      setRestEndTime(null);

      // 3. Ejecutamos el cambio en el motor (apaga la anterior, prende esta)
      switchActiveTask(task.id);
      
      showToast(`¡Cambiando a: ${task.name}!`, "success");
      clickCounterRef.current.count = 0; // Reset contador
      
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const triggerFileUpload = (taskId: number) => {
      setTaskToCompleteId(taskId);
      if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files ? e.target.files[0] : null;
      if (!file || !taskToCompleteId) return;
      try {
          setIsAnimating(true);
          const base64 = await compressImage(file);
          const task = tasks.find(t => t.id === taskToCompleteId);
          if (task) { 
             completeTask(taskToCompleteId, task.reward, base64); 
             showToast(`¡+${task.reward} monedas!`, 'success'); 
             
             // CALCULO DEL DESCANSO
             const startTime = taskStartTimes.current[taskToCompleteId];
             let duration = 5000;
             if (startTime) duration = Date.now() - startTime;
             setRestEndTime(Date.now() + duration);
          }
      } catch (e) { showToast("Error imagen", 'error'); } finally { setIsAnimating(false); setTaskToCompleteId(null); }
  };

  const handleDeleteAllTasks = () => {
    if (isResetConfirming) {
      resetTasks(); setActiveTaskId(null); setAnimationState("idle"); setIsResetConfirming(false);
    } else {
      setIsResetConfirming(true); resetTimeoutRef.current = window.setTimeout(() => setIsResetConfirming(false), 3000);
    }
  };

  // --- DRAG LOGIC ---
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string | number, pos: { top: number; left: number }) => {
    if (e.type === 'touchstart' && (e as React.TouchEvent).touches && (e as React.TouchEvent).touches.length > 1) return;
    (e as React.UIEvent).stopPropagation();
    if ((e as React.MouseEvent).button !== undefined && (e as React.MouseEvent).button !== 0) return;
    if (isAnimating) return;

    const clientX = (e as any).type && (e as any).type.includes('touch') ? (e as any).touches[0].clientX : (e as any).clientX;
    const clientY = (e as any).type && (e as any).type.includes('touch') ? (e as any).touches[0].clientY : (e as any).clientY;

    setIsDragging(true);
    setDraggedObjectId(id);

    if (parcelaRef.current) {
      const rect = parcelaRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: clientX - (rect.left + (rect.width * pos.left / 100)),
        y: clientY - (rect.top + (rect.height * pos.top / 100))
      };
    }
  };

  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !draggedObjectId || !parcelaRef.current) return;
    e.preventDefault();
    const clientX = (e as TouchEvent).type && (e as TouchEvent).type.includes('touch') ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = (e as TouchEvent).type && (e as TouchEvent).type.includes('touch') ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    const rect = parcelaRef.current.getBoundingClientRect();
    
    let left = Math.max(0, Math.min(100, ((clientX - rect.left - dragOffset.current.x) / rect.width) * 100));
    let top = Math.max(0, Math.min(100, ((clientY - rect.top - dragOffset.current.y) / rect.height) * 100));
    
    setParcelaObjects(prev => prev.map(o => o.id === draggedObjectId ? { ...o, position: { top, left } } : o));
  }, [isDragging, draggedObjectId, setParcelaObjects]);

  const handleDragEnd = async () => {
    setIsDragging(false);
    setDraggedObjectId(null);
    if (currentUser && objectsRef.current.length > 0) { smartSave({ objects: objectsRef.current }); }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag); window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag, { passive: false }); window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDrag); window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag); window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag); window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag); window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDrag]);

  // --- TOUCH / ZOOM ---
  const handleContainerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || isAnyMenuOpen) return;
    if (e.touches.length === 2) {
      lastTouchRef.current = { distance: getDistance(e.touches), x: getMidpoint(e.touches).x, y: getMidpoint(e.touches).y };
    } else if (e.touches.length === 1 && !isDragging) {
      lastTouchRef.current = { distance: null, x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleContainerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || isDragging || isAnyMenuOpen) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getDistance(e.touches);
      const mid = getMidpoint(e.touches);
      const scaleFactor = dist / (lastTouchRef.current.distance || dist);
      const newScale = Math.min(Math.max(0.5, viewTransform.scale * scaleFactor), 4);
      const dx = mid.x - lastTouchRef.current.x;
      const dy = mid.y - lastTouchRef.current.y;
      setViewTransform(prev => ({ scale: newScale, x: prev.x + dx, y: prev.y + dy }));
      lastTouchRef.current = { distance: dist, x: mid.x, y: mid.y };
    } else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastTouchRef.current = { ...lastTouchRef.current, x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const changeThemeColor = (color: string, save = true) => {
    const colors: any = { indigo: { p: "#4f46e5", b: "#a5b4fc" }, pink: { p: "#ec4899", b: "#f9a8d4" }, teal: { p: "#0d9488", b: "#5eead4" }, yellow: { p: "#ca8a04", b: "#fcd34d" } };
    let p, b;
    if (color.startsWith("#")) {
      p = color; try { const rgb = hexToRgb(color); b = `rgba(${rgb}, 0.4)`; } catch (e) { b = "#e0e7ff"; }
    } else {
      const key = color; if (colors[key]) { p = colors[key].p; b = colors[key].b; } else { p = '#4f46e5'; b = '#a5b4fc'; }
    }
    document.documentElement.style.setProperty("--theme-color-primary", p);
    document.documentElement.style.setProperty("--theme-color-bg", b);
    document.documentElement.style.setProperty("--theme-rgb", hexToRgb(p));
    if (save) saveTheme(color);
    if (!color.startsWith("#")) setConfigDropdownOpen(false);
  };

  const getLumberjackImage = () => {
    if (animationState === "idle") return images.lumberjack.idle;
    if (animationState === "chopping") return images.lumberjack.chopping[lumberjackFrame];
    return images.lumberjack.sitting[lumberjackFrame];
  };

  const storeItems: StoreItem[] = [
    { name: "Perro", description: "Un fiel compañero.", cost: 150, type: "object", objectId: "perro", lucideIcon: Heart },
    { name: "Gato", description: "Un adorable gatito.", cost: 100, type: "object", objectId: "gato", lucideIcon: Cat },
    { name: "Casa", description: "Una hermosa casa.", cost: 500, type: "object", objectId: "casa", lucideIcon: Home },
  ];
  const images = {
    parcela: parcelaImg,
    lumberjack: { idle: baseImg, chopping: [trabajandoImg, trabajando2Img], sitting: [descansoImg, descanso2Img] },
    objects: { perro: perroImg, gato: gatoImg, casa: casaImg },
  };

  const DonutChart: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const total = tasks.length === 0 ? 1 : tasks.length;
    const completed = tasks.filter((t: Task) => t.completed).length;
    const inProgress = tasks.filter((t: Task) => t.inProgress).length;
    const pending = total - completed - inProgress;
    const r = 16; const c = 2 * Math.PI * r;
    const p1 = (completed / total) * c;
    const p2 = (inProgress / total) * c;
    const p3 = (pending / total) * c;
    return (
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 40 40" className="transform -rotate-90 w-full h-full">
            <circle cx="20" cy="20" r="16" fill="transparent" stroke="#e5e7eb" strokeWidth="8" />
            <circle cx="20" cy="20" r="16" fill="transparent" stroke="#22c55e" strokeWidth="8" strokeDasharray={`${p1} ${c}`} />
            <circle cx="20" cy="20" r="16" fill="transparent" stroke="#3b82f6" strokeWidth="8" strokeDasharray={`${p2} ${c}`} strokeDashoffset={-p1} />
            <circle cx="20" cy="20" r="16" fill="transparent" stroke="#f59e0b" strokeWidth="8" strokeDasharray={`${p3} ${c}`} strokeDashoffset={-(p1 + p2)} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><p className="text-xl font-black text-gray-700">{tasks.length}</p><p className="text-[8px] text-gray-400 uppercase">Total</p></div></div>
        </div>
        <div className="space-y-2 text-xs font-medium text-gray-600">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Terminadas ({completed})</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> En Proceso ({inProgress})</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Pendientes ({pending})</div>
        </div>
      </div>
    );
  };

  const LineChart = () => (
    <div className="w-full h-32 flex items-end justify-between gap-1 pt-4">
      {[40, 60, 35, 80, 55, 90, 45, 70, 50, 95, 65, 85].map((h, i) => (
        <div key={i} className="w-full bg-indigo-200/50 rounded-t-sm hover:bg-indigo-400 transition-all relative group" style={{ height: `${h}%` }}>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">{h}%</div>
        </div>
      ))}
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
        <style>{`@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } } .float-anim { animation: float 6s ease-in-out infinite; }`}</style>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-90"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${images.parcela})`, backgroundSize: 'cover' }}></div>
        <div className="relative z-10 bg-white/20 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/40 text-center max-w-md w-full mx-4 float-anim">
          <div className="mb-6 inline-block p-4 bg-white/30 rounded-full shadow-lg"><User size={48} className="text-white" /></div>
          <h1 className="text-5xl font-black text-white mb-1 tracking-tighter drop-shadow-md">YOTIP</h1>
          <p className="text-xs text-indigo-100 uppercase tracking-widest font-bold mb-6">Your Time, Your Productivity</p>
          <p className="text-indigo-50 mb-4 font-medium text-sm">Accede a tu espacio con correo y contraseña.</p>
          <div className="mb-4 flex gap-2 justify-center">
            <button type="button" onClick={() => setIsSignup(false)} className={`px-4 py-2 rounded-xl font-bold ${!isSignup ? 'bg-white text-indigo-700' : 'bg-white/30 text-white'}`}>Iniciar sesión</button>
            <button type="button" onClick={() => setIsSignup(true)} className={`px-4 py-2 rounded-xl font-bold ${isSignup ? 'bg-white text-indigo-700' : 'bg-white/30 text-white'}`}>Crear cuenta</button>
          </div>
          {loginError && (
            <div role="alert" aria-live="assertive" className="mb-3 flex items-start gap-3 bg-white/30 border border-red-400 text-red-800 px-3 py-2 rounded-lg">
              <AlertTriangle className="text-red-700 mt-0.5" />
              <div className="text-sm font-bold">{loginError}</div>
            </div>
          )}
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            <label className="text-xs text-indigo-100 font-medium text-left block">Correo electrónico</label>
            <input autoFocus type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/90 border-0 text-gray-800 font-medium placeholder-gray-400 focus:ring-4 focus:ring-indigo-400/50 transition outline-none shadow-inner" />
            <label className="text-xs text-indigo-100 font-medium text-left block">Contraseña</label>
            <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/90 border-0 text-gray-800 font-medium placeholder-gray-400 focus:ring-4 focus:ring-indigo-400/50 transition outline-none shadow-inner" />
            <div className="flex gap-2">
              <button type="submit" disabled={authLoading || !email.trim() || !password} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition">
                {authLoading ? (isSignup ? 'Creando...' : 'Ingresando...') : (isSignup ? 'Crear cuenta' : 'Entrar')}
              </button>
              <button type="button" onClick={() => { setIsSignup(s => !s); setLoginError(''); }} className="flex-1 py-3 bg-white/60 text-indigo-700 font-bold rounded-xl border border-white/40">{isSignup ? 'Ya tengo cuenta' : 'Crear cuenta'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-indigo-800 font-bold text-lg">Cargando tu parcela...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-sans text-gray-800 transition-colors duration-700 overflow-hidden" style={{ backgroundColor: 'var(--theme-color-bg)' }}>
      <style>{`
        @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .pop-in { animation: popIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
        :root { --theme-color-primary: #4f46e5; --theme-color-bg: #a5b4fc; --theme-rgb: 79, 70, 229; }
        .liquid-glass { background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(24px) saturate(200%); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.2); border-radius: 24px; }
        .liquid-glass-panel { background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 16px; transition: all 0.2s ease; }
        .liquid-glass-panel:hover { background: rgba(255, 255, 255, 0.7); box-shadow: 0 4px 20px rgba(var(--theme-rgb), 0.2); transform: translateY(-2px); border-color: var(--theme-color-primary); }
        .color-circle-wrapper { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; position: relative; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer; }
        .color-input-fix { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; padding: 0; margin: 0; cursor: pointer; border: none; }
        .parcela-object { position: absolute; transform: translate(-50%, -50%); cursor: grab; user-select: none; transition: transform 0.1s; }
        .parcela-object:active { cursor: grabbing; transform: translate(-50%, -50%) scale(0.95); }
      `}</style>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />

      {isSaving && (
        <div className="fixed top-4 right-4 z-[100] bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl border border-white/20 flex items-center gap-3 animate-pulse">
            <Loader2 className="animate-spin text-indigo-400" size={18}/>
            <span className="text-xs font-bold tracking-wider uppercase">Guardando...</span>
        </div>
      )}

      <div className="hidden" style={{ display: 'none' }}>
        <img src={images.lumberjack.idle} alt="preload" />
        {images.lumberjack.chopping.map((src, i) => <img key={`chop-${i}`} src={src} alt="preload" />)}
        {images.lumberjack.sitting.map((src, i) => <img key={`sit-${i}`} src={src} alt="preload" />)}
      </div>

      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ${toast.visible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}>
        <div className="liquid-glass px-6 py-4 flex items-center gap-4 bg-white/60 shadow-xl">
          {toast.type === "success" ? <ThumbsUp className="text-green-600" /> : toast.type === "error" ? <AlertTriangle className="text-red-600" /> : <Info className="text-blue-600" />}
          <p className="text-sm font-bold text-gray-900">{toast.message}</p>
        </div>
      </div>

      {previewImageSrc && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4" onClick={() => setPreviewImageSrc(null)}>
          <div className="relative max-w-3xl w-full max-h-full pop-in group" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImageSrc(null)} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition z-10"><X size={20} /></button>
            <img src={previewImageSrc} alt="Evidencia Completa" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl border-2 border-white/50 bg-white" />
          </div>
        </div>
      )}

      {isAddTaskModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-md liquid-glass p-8 pop-in shadow-2xl border border-white/60">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Pencil className="text-indigo-600" /> Nueva Tarea</h3>
            <form onSubmit={handleAddTask} className="space-y-5">
              <div><label className="text-xs font-bold uppercase text-gray-600 mb-1 block">Actividad</label><input name="taskName" required className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/50 transition font-medium" placeholder="Ej: Estudiar" /></div>
              <div><label className="text-xs font-bold uppercase text-gray-600 mb-1 block">Recompensa</label><input name="taskReward" type="number" required min="1" className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/50 transition font-medium" placeholder="100" /></div>
              <div><label className="text-xs font-bold uppercase text-gray-600 mb-1 block flex items-center gap-1"><Clock size={12} /> Límite</label><input name="taskDeadline" type="datetime-local" className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/50 transition font-medium" /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setIsAddTaskModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-white/50 rounded-xl transition">Cancelar</button><button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg flex items-center gap-2">Guardar <Sparkles size={16} /></button></div>
            </form>
          </div>
        </div>
      )}

      {isContactOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={() => setIsContactOpen(false)}>
          <div className="w-full max-w-sm liquid-glass p-8 pop-in shadow-2xl border-t-4 border-indigo-500 text-center bg-white/70" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4"><Mail size={32} className="text-indigo-600" /></div>
            <h3 className="text-2xl font-black text-gray-800 mb-1">Equipo 6 YOTIP</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Soporte y Desarrollo</p>
            <button onClick={() => setIsContactOpen(false)} className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition">Cerrar</button>
          </div>
        </div>
      )}

      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="w-full max-w-md liquid-glass p-6 pop-in shadow-2xl border border-white/60" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><User className="text-indigo-600" /> Elige un nombre de usuario</h3>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <input autoFocus value={desiredUsername} onChange={(e) => setDesiredUsername(e.target.value)} placeholder="usuario_ejemplo" className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/50 focus:outline-none" />
                {usernameError && <p className="text-xs text-red-500 mt-2">{usernameError}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="submit" disabled={usernameChecking} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">{usernameChecking ? 'Guardando...' : 'Guardar nombre'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 w-80 liquid-glass z-[50] p-6 m-4 transition-transform duration-500 ${storeDrawerOpen ? "translate-x-0" : "-translate-x-[150%]"}`}>
        <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><ShoppingCart className="text-indigo-600" /> Tienda</h3><button onClick={toggleStoreDrawer} className="p-2 hover:bg-black/5 rounded-full transition"><X size={20} /></button></div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-100/80 to-orange-100/80 border border-white/50 mb-6 shadow-sm backdrop-blur-sm"><p className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">Tu Saldo</p><p className="text-4xl font-black text-yellow-600 flex items-center gap-1 tracking-tighter">{coins}<DollarSign size={28} /></p></div>
        <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
          {storeItems.map((item, i) => (
            <div key={i} className="liquid-glass-panel p-4 flex items-center justify-between group cursor-pointer"><div><div className="flex items-center gap-2 mb-1">{item.lucideIcon && <item.lucideIcon size={18} className="text-gray-800" />} <span className="font-bold text-gray-900">{item.name}</span></div><p className="text-[10px] text-gray-600 font-medium">{item.description}</p></div><button onClick={() => handleBuyItem(item)} className="ml-2 bg-white/80 text-indigo-700 border border-indigo-100 font-bold text-xs px-3 py-2 rounded-lg shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex flex-col items-center min-w-[60px]"><span>${item.cost}</span></button></div>
          ))}
        </div>
      </aside>

      <aside className={`fixed inset-y-0 right-0 w-96 liquid-glass z-[50] p-6 m-4 transition-transform duration-500 flex flex-col ${activitiesDrawerOpen ? "translate-x-0" : "translate-x-[150%]"}`}>
        <div className="flex justify-between items-center mb-8 shrink-0"><h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><ListTodo className="text-indigo-600" /> Actividades</h3><button onClick={toggleActivitiesDrawer} className="p-2 hover:bg-black/5 rounded-full transition"><X size={20} /></button></div>
        <button onClick={() => { setIsAddTaskModalOpen(true); closeAllMenus(); }} className="w-full mb-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 shrink-0"><Plus size={20} /> Crear Nueva Tarea</button>

        <div className="space-y-3 overflow-y-auto flex-1 pr-1 min-h-0">
          {tasks.filter(t => !t.archived).map((task) => (
            <div 
              key={task.id} 
              onClick={() => handleTaskCardClick(task)} // <--- AQUI SE DETECTAN LOS 5 CLICKS
              className={`relative p-4 rounded-2xl border transition-all select-none cursor-pointer active:scale-[0.98] ${task.completed ? "bg-green-50/60 border-green-200/60 opacity-90" : task.inProgress ? "bg-slate-800 border-slate-600 text-white shadow-xl scale-[1.02]" : "liquid-glass-panel"}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-full flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`font-bold ${task.inProgress ? "text-white" : "text-gray-900"} ${task.completed && "line-through decoration-green-500/50"}`}>{task.name}</p>
                    <p className={`text-xs font-bold ${task.inProgress ? "text-blue-300" : "text-indigo-600"} flex items-center mt-1`}>+{task.reward} Monedas</p>
                    {task.deadline && !task.completed && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100/50 border border-red-200 text-[10px] font-bold text-red-600">Expira: {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    )}
                  </div>
                  {task.completed && task.proofImage && (
                    <div className="relative group cursor-pointer shrink-0" onClick={(e) => { e.stopPropagation(); setPreviewImageSrc(task.proofImage ?? null); }}>
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-4 border-green-200/50 shadow-sm transition-transform group-hover:scale-105"><img src={task.proofImage} alt="Proof" className="w-full h-full object-cover" /></div>
                    </div>
                  )}
                  {task.inProgress && !task.completed && <div className="animate-pulse bg-white/20 text-white p-1.5 rounded-lg shrink-0"><Zap size={14} /></div>}
                </div>
              </div>
              <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                {!task.completed ? (
                  <>
                    <button onClick={() => handleStartTask(task.id)} disabled={task.inProgress || isAnimating} className={`flex-1 py-2 border text-xs font-bold rounded-lg transition disabled:opacity-50 ${task.inProgress ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed" : "bg-white/60 border-white text-gray-700 hover:bg-blue-50 hover:text-blue-700"}`}>{task.inProgress ? "En curso..." : "Iniciar"}</button>
                    <button onClick={() => triggerFileUpload(task.id)} disabled={!task.inProgress} className={`flex-1 py-2 text-xs font-bold rounded-lg shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 ${task.inProgress ? "bg-white text-gray-900 hover:bg-gray-200" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}><Upload size={14} /> ¡Hecho!</button>
                  </>
                ) : (<div className="w-full py-1.5 text-center text-xs font-bold text-green-700 bg-green-100/50 border border-green-200 rounded-lg">¡Completada!</div>)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200/30 shrink-0">
          <button onClick={handleDeleteAllTasks} className={`w-full py-3 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-300 ${isResetConfirming ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}>
            <Trash2 size={18} className={isResetConfirming ? "animate-bounce" : ""} />{isResetConfirming ? "¿Seguro? Click para confirmar" : "Eliminar todas las tareas"}
          </button>
        </div>
      </aside>

      <header className={`fixed top-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-5xl z-[50] pointer-events-auto transition-transform duration-300 ease-in-out ${isAnyMenuOpen ? '-translate-y-[150%]' : 'translate-y-0'}`}>
        <div className="liquid-glass px-3 sm:px-6 py-3 flex justify-between items-center shadow-xl">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 text-white p-2 rounded-lg shadow-lg shadow-indigo-500/30"><BarChart4 size={20} /></div>
            <div><h1 className="hidden sm:block text-lg font-black text-gray-900 tracking-tight leading-none">YOTIP</h1><span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest hidden sm:block">Your Time Your Productivity</span></div>
            <button onClick={toggleTycoonPanel} className="hidden sm:block ml-2 text-xs font-bold text-gray-600 hover:text-indigo-700 bg-white/40 px-3 py-1.5 rounded-lg transition border border-white/50 hover:bg-white/80">Datos</button>
          </div>
          <nav className="flex items-center gap-1 sm:gap-3">
            <button onClick={toggleStoreDrawer} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-indigo-700 px-2 sm:px-3 py-2 rounded-xl hover:bg-white/50 transition"><ShoppingCart size={18} /> <span className="hidden sm:inline">Tienda</span></button>
            <button onClick={toggleActivitiesDrawer} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-indigo-700 px-2 sm:px-3 py-2 rounded-xl hover:bg-white/50 transition"><ListTodo size={18} /> <span className="hidden sm:inline">Tareas</span></button>
            <div className="h-6 w-[1px] bg-gray-400/30 mx-1 sm:mx-2"></div>
            <div className="flex items-center justify-center gap-1 bg-yellow-100/50 border border-yellow-200/50 px-2 sm:px-3 py-1.5 rounded-xl backdrop-blur-sm min-w-[80px] whitespace-nowrap"><span className="font-black text-yellow-700 text-sm">{coins}</span><DollarSign size={14} className="text-yellow-600" /></div>
            <button onClick={toggleTycoonPanel} className="sm:hidden p-2 text-gray-500 hover:text-indigo-700 transition"><BarChart4 size={20} /></button>
            <button onClick={toggleConfig} className="p-2 text-gray-500 hover:text-indigo-700 transition hover:rotate-90 duration-300"><Settings size={20} /></button>
            <button onClick={handleLogout} className="p-2 text-red-400 hover:text-red-600 bg-red-50/50 rounded-lg transition"><LogOut size={18} /></button>
          </nav>
          {configDropdownOpen && (
            <div className="absolute top-full right-0 mt-4 w-64 liquid-glass p-5 shadow-2xl pop-in z-50">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Tema de color</p>
              <div className="flex gap-3 mb-4 justify-between">
                {['indigo', 'pink', 'teal', 'yellow'].map(c => (
                  <button key={c} onClick={() => changeThemeColor(c)} style={{ backgroundColor: c === 'indigo' ? '#4f46e5' : c === 'pink' ? '#ec4899' : c === 'teal' ? '#0d9488' : '#ca8a04' }} className={`w-10 h-10 rounded-full shadow-lg border-2 border-white ring-2 ring-transparent hover:scale-110 transition`}></button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-400/20"><span className="text-xs font-bold text-gray-600">Personalizado</span><div className="color-circle-wrapper"><input type="color" onChange={(e) => changeThemeColor(e.target.value)} className="color-input-fix" /></div></div>
            </div>
          )}
        </div>
      </header>

      {tycoonPanelOpen && (
        <div className="fixed inset-0 z-[60] pt-10 px-4 bg-black/10 backdrop-blur-sm transition-all flex items-center justify-center" onClick={() => setTycoonPanelOpen(false)}>
          <div className="w-full max-w-6xl liquid-glass p-8 pop-in shadow-2xl border-t-4 border-indigo-500 bg-white/80 h-[85vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setTycoonPanelOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={24} /></button>
            <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-2"><Activity className="text-indigo-600" /> Actividad de {username || currentUser}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 mb-6 overflow-y-auto min-h-0">
              <div className="bg-white/50 rounded-3xl p-6 border border-white/50 shadow-inner flex flex-col h-64 lg:h-auto">
                <h4 className="font-bold text-gray-600 mb-4">Actividad Semanal</h4>
                <div className="flex-1 flex items-end justify-between gap-2 pb-4 relative"><LineChart /></div>
                <div className="flex justify-between text-xs text-gray-400 font-bold px-2"><span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span></div>
              </div>
              <div className="bg-white/50 rounded-3xl p-6 border border-white/50 shadow-inner flex flex-col items-center justify-center h-64 lg:h-auto">
                <h4 className="font-bold text-gray-600 mb-4 w-full text-left">Estado de Tareas</h4>
                <DonutChart tasks={tasks} />
              </div>
            </div>
            <div className="bg-white/50 rounded-3xl p-6 border border-white/50 shadow-inner overflow-hidden flex-1 flex flex-col min-h-[200px]">
              <div className="grid grid-cols-5 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-300/50 pb-3 mb-2">
                <div className="flex items-center gap-1"><Calendar size={14} /> Fecha</div>
                <div className="flex items-center gap-1 col-span-2">Nombre</div>
                <div className="flex items-center gap-1">Progreso</div>
                <div className="flex items-center gap-1 text-right justify-end">Dificultad</div>
              </div>
              <div className="overflow-y-auto pr-2 space-y-2 flex-1">
                {tasks.map(t => {
                  let starCount = Math.min(5, Math.max(1, Math.floor(t.reward / 100)));
                  if (t.reward >= 500) starCount = 5;
                  const isMaxLevel = t.reward >= 1000;
                  const starColor = isMaxLevel ? "text-purple-600" : "text-yellow-400";
                  return (
                    <div key={t.id} className={`grid grid-cols-5 gap-4 items-center py-3 border-b border-gray-200/30 hover:bg-white/40 transition rounded-lg px-2 ${t.archived ? 'opacity-50 grayscale' : ''}`}>
                      <div className="text-xs font-bold text-gray-600">{t.deadline ? new Date(t.deadline).toLocaleDateString() : "Hoy"}</div>
                      <div className="col-span-2 font-bold text-gray-800 truncate flex items-center gap-2">
                        {t.proofImage && <ImageIcon size={14} className="text-indigo-500" />}
                        {t.name}
                        <span className="text-[10px] text-indigo-400 font-normal block">{currentUser} {t.archived && "(Archivado)"}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{t.completed ? "100%" : t.inProgress ? "50%" : "0%"}</span>
                          <div className={`w-3 h-3 rounded-full ${t.completed ? "bg-green-500" : t.inProgress ? "bg-blue-500" : "bg-gray-300"}`}></div>
                        </div>
                      </div>
                      <div className={`flex justify-end gap-0.5 ${starColor}`}>{[...Array(starCount)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-3xl z-[30] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) cursor-pointer ${isBannerExpanded ? 'translate-y-[-20px]' : 'translate-y-[72%]'}`} onClick={() => setIsBannerExpanded(!isBannerExpanded)}>
        <div className="liquid-glass px-6 pb-6 pt-3 shadow-2xl border-t border-white/70 bg-white/60 hover:bg-white/70 transition-colors">
          <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 opacity-60"></div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full"><HelpCircle size={20} /></div>
              <div><p className="text-sm font-bold text-gray-800">Centro de Ayuda</p><p className="text-xs text-gray-500">Guía rápida y soporte</p></div>
            </div>
            <div className="transform transition-transform duration-500" style={{ transform: isBannerExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}><ChevronUp size={20} className="text-gray-400" /></div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200/50 flex justify-between items-center opacity-90">
            <div className="text-xs text-gray-600 space-y-1"><p><strong>1.</strong> Inicia tareas para activar al leñador.</p><p><strong>2.</strong> Sube tu evidencia antes de que expire.</p><p><strong>3.</strong> ¡Cuidado! Si expira pierdes monedas.</p></div>
            <button onClick={(e) => { e.stopPropagation(); setIsContactOpen(true); }} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition flex items-center gap-2">Soporte <Mail size={14} /></button>
          </div>
        </div>
      </div>

      <main className="pt-0 pb-0 min-h-screen w-full h-screen overflow-hidden relative flex items-center justify-center bg-gradient-to-t from-indigo-900/20 to-transparent" ref={containerRef} onTouchStart={handleContainerTouchStart} onTouchMove={handleContainerTouchMove} style={{ touchAction: 'none' }}>
        <div style={{ transform: isMobile ? `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})` : 'none', transformOrigin: 'center center', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }} className="w-full flex items-center justify-center pointer-events-auto">
          <div ref={parcelaRef} className="relative transition-all duration-500 md:w-full md:max-w-6xl md:aspect-video md:h-auto w-[1600px] h-[1000px] liquid-glass p-0 shadow-2xl group overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-no-repeat bg-center opacity-90" style={{ backgroundImage: `url(${images.parcela})`, backgroundSize: 'cover' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent pointer-events-none"></div>

            {parcelaObjects.length === 0 && animationState === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"><div className="liquid-glass px-8 py-6 text-center animate-pulse bg-white/60"><Home size={48} className="mx-auto text-indigo-600 mb-2 opacity-80" /><h2 className="text-xl font-black text-gray-800">Parcela Vacía</h2><p className="text-sm text-gray-600 font-medium">Ve a la tienda y comienza a decorar</p></div></div>
            )}

            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-500">
              <div className="relative">
                <img key={getLumberjackImage()} src={getLumberjackImage()} alt="Leñador" className="h-32 object-contain drop-shadow-2xl" style={{ imageRendering: "pixelated" }} />
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-1 rounded-xl shadow-lg border-2 border-white transform hover:scale-110 transition flex flex-col items-center">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Jugador</span>
                  <span className="text-sm font-black text-gray-800 leading-none pb-1">{username || currentUser}</span>
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-3 py-1 rounded-full shadow-lg text-[10px] font-bold text-white whitespace-nowrap flex items-center gap-1 border border-white/20">
                  {animationState === "idle" && <>💤 Esperando...</>}{animationState === "chopping" && <><Zap size={10} className="text-yellow-400" /> Trabajando</>}{animationState === "sitting" && <><Sparkles size={10} className="text-indigo-300" /> Descansando</>}
                </div>
              </div>
            </div>

            {parcelaObjects.map((obj) => (
              <div key={obj.id} className={`absolute transition-transform active:scale-95 ${isDragging && draggedObjectId === obj.id ? "z-50 cursor-grabbing scale-110" : "z-10 cursor-grab hover:z-20"}`} style={{ top: `${obj.position.top}%`, left: `${obj.position.left}%`, transform: 'translate(-50%, -50%)' }} onMouseDown={(e) => handleDragStart(e, obj.id, obj.position)} onTouchStart={(e) => handleDragStart(e, obj.id, obj.position)}>
                <div className="relative group/obj">
                  <img src={(images.objects as any)[obj.objectId]} className={`${obj.objectId === "casa" ? "h-48 drop-shadow-2xl" : "h-20 drop-shadow-xl"} object-contain transition filter group-hover/obj:brightness-110`} style={{ imageRendering: "pixelated" }} draggable="false" />
                  {!isDragging && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover/obj:opacity-100 transition-all transform translate-y-2 group-hover/obj:translate-y-0">
                      <button onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeParcelaObject(obj.id) }} className="bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition border-2 border-white"><X size={12} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;