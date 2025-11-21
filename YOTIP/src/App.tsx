import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart,
  ListTodo,
  Settings,
  DollarSign,
  BarChart4,
  X,
  Plus,
  Check,
  Zap,
  Heart,
  Cat,
  Home,
  Palette,
  Sparkles,
  Pencil,
  AlertTriangle,
  Info,
  ThumbsUp,
  MousePointer2,
  Trash2,
  Clock,
  User,
  LogOut,
  Calendar,
  Activity,
  Star,
  HelpCircle,
  Mail,
  MessageCircle,
  ChevronUp,
  Upload,
  Image as ImageIcon,
  Maximize2,
  RefreshCw
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
function hexToRgb(hex) {
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
  const expandedHex = cleanHex.length === 3 ? cleanHex.split("").map((char) => char + char).join("") : cleanHex;
  const bigint = parseInt(expandedHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Añado 'archived: false' a las tareas por defecto
const DEFAULT_TASKS = [
    { id: 1, name: "Leer 1 artículo", reward: 10, completed: false, inProgress: false, deadline: null, proofImage: null, archived: false },
    { id: 2, name: "Organizar correo", reward: 25, completed: false, inProgress: false, deadline: null, proofImage: null, archived: false },
    { id: 3, name: "Ejercicio 30 min", reward: 50, completed: false, inProgress: false, deadline: null, proofImage: null, archived: false },
];

function App() {
  // --- 1. SESIÓN PERSISTENTE ---
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("activeUser") || null);
  const [loginName, setLoginName] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- 2. ESTADOS DEL JUEGO ---
  const [coins, setCoins] = useState(5000);
  const [parcelaObjects, setParcelaObjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  // --- 3. UI STATES ---
  const [storeDrawerOpen, setStoreDrawerOpen] = useState(false);
  const [activitiesDrawerOpen, setActivitiesDrawerOpen] = useState(false);
  const [configDropdownOpen, setConfigDropdownOpen] = useState(false);
  const [tycoonPanelOpen, setTycoonPanelOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isBannerExpanded, setIsBannerExpanded] = useState(false);
  
  const [previewImageSrc, setPreviewImageSrc] = useState(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationState, setAnimationState] = useState("idle");
  const [lumberjackFrame, setLumberjackFrame] = useState(0);
  
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedObjectId, setDraggedObjectId] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const parcelaRef = useRef(null);
  
  const fileInputRef = useRef(null);
  const [taskToCompleteId, setTaskToCompleteId] = useState(null);
  
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const resetTimeoutRef = useRef(null);

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false, type: "success" });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4000);
  }, []);

  // --- 4. LOGICA DE CARGA ---
  useEffect(() => {
      if (currentUser) {
          const savedCoins = localStorage.getItem(`${currentUser}_coins`);
          setCoins(savedCoins ? parseInt(savedCoins) : 5000);

          const savedObjs = localStorage.getItem(`${currentUser}_objects`);
          try { 
              const parsed = JSON.parse(savedObjs);
              setParcelaObjects(Array.isArray(parsed) ? parsed : []);
          } catch(e) { setParcelaObjects([]); }

          const savedTasks = localStorage.getItem(`${currentUser}_tasks`);
          let loadedTasks = [];
          try { 
              const parsedTasks = JSON.parse(savedTasks);
              loadedTasks = parsedTasks || [];
              // Asegurarse de que las tareas cargadas tengan la propiedad archived (por si son antiguas)
              loadedTasks = loadedTasks.map(t => ({ ...t, archived: t.archived || false }));
              setTasks(loadedTasks);
          } catch(e) { 
              loadedTasks = DEFAULT_TASKS;
              setTasks(loadedTasks); 
          }

          // Solo activar leñador si la tarea NO está archivada
          const activeTask = loadedTasks.find(t => t.inProgress && !t.archived);
          if (activeTask) {
              setActiveTaskId(activeTask.id);
              setAnimationState("chopping");
          } else {
              setActiveTaskId(null);
              setAnimationState("idle");
          }

          const savedTheme = localStorage.getItem(`${currentUser}_theme`);
          changeThemeColor(savedTheme || "indigo", false);

          setIsDataLoaded(true);
      } else {
          setIsDataLoaded(false);
      }
  }, [currentUser]);

  // --- 5. LÓGICA DE GUARDADO ---
  useEffect(() => { if (currentUser && isDataLoaded) localStorage.setItem(`${currentUser}_coins`, coins.toString()); }, [coins, currentUser, isDataLoaded]);
  useEffect(() => { if (currentUser && isDataLoaded) localStorage.setItem(`${currentUser}_objects`, JSON.stringify(parcelaObjects)); }, [parcelaObjects, currentUser, isDataLoaded]);
  useEffect(() => { if (currentUser && isDataLoaded) localStorage.setItem(`${currentUser}_tasks`, JSON.stringify(tasks)); }, [tasks, currentUser, isDataLoaded]);

  const handleLogin = (e) => {
      e.preventDefault();
      const name = loginName.trim();
      if (name) {
          localStorage.setItem("activeUser", name);
          setCurrentUser(name);
      }
  };

  const handleLogout = () => {
      if(confirm("¿Cerrar sesión?")) {
          localStorage.removeItem("activeUser");
          setIsDataLoaded(false);
          setCurrentUser(null);
          setLoginName("");
          setCoins(5000);
          setParcelaObjects([]);
          setTasks([]);
          setActiveTaskId(null);
          setAnimationState("idle");
          changeThemeColor("indigo", false);
      }
  };

  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        setTasks(currentTasks => {
            let penaltyOccurred = false;
            let penaltyAmount = 0;
            const remainingTasks = currentTasks.filter(t => {
                // Ignorar si está completada, no tiene fecha O ESTÁ ARCHIVADA
                if (t.completed || !t.deadline || t.archived) return true;
                
                const isExpired = new Date(t.deadline) < now;
                if (isExpired) {
                    if (t.inProgress) {
                        penaltyOccurred = true;
                        penaltyAmount += t.reward;
                        if (t.id === activeTaskId) setActiveTaskId(null);
                    }
                    // Si expira, se borra (filtro false)
                    return false; 
                }
                return true;
            });
            if (penaltyOccurred && penaltyAmount > 0) {
                setTimeout(() => {
                    setCoins(c => Math.max(0, c - penaltyAmount));
                    showToast(`¡Tarea vencida! -${penaltyAmount} monedas`, "error");
                }, 0);
            }
            return remainingTasks;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTaskId, showToast]);

  useEffect(() => {
    let interval;
    if (animationState === "chopping") interval = setInterval(() => setLumberjackFrame(p => (p + 1) % 2), 300);
    else if (animationState === "sitting") interval = setInterval(() => setLumberjackFrame(p => (p + 1) % 2), 500);
    else setLumberjackFrame(0);
    return () => clearInterval(interval);
  }, [animationState]);

  useEffect(() => {
    const working = tasks.some(t => t.inProgress && !t.archived); // Solo cuenta si no está archivada
    if (!activeTaskId && !working && animationState === "chopping") {
      setIsAnimating(true); setAnimationState("sitting");
      setTimeout(() => { setAnimationState("idle"); setIsAnimating(false); }, 2000);
    } else if (working && animationState !== "chopping") {
      setAnimationState("chopping");
    }
  }, [activeTaskId, tasks, animationState]);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const closeAllMenus = () => { setConfigDropdownOpen(false); setTycoonPanelOpen(false); setIsContactOpen(false); setIsBannerExpanded(false); }; 
  const toggleStoreDrawer = () => { closeAllMenus(); setStoreDrawerOpen(!storeDrawerOpen); };
  const toggleActivitiesDrawer = () => { closeAllMenus(); setActivitiesDrawerOpen(!activitiesDrawerOpen); };
  const toggleConfig = () => { closeAllMenus(); setStoreDrawerOpen(false); setActivitiesDrawerOpen(false); setConfigDropdownOpen(!configDropdownOpen); };
  const toggleTycoonPanel = () => { closeAllMenus(); setStoreDrawerOpen(false); setActivitiesDrawerOpen(false); setTycoonPanelOpen(!tycoonPanelOpen); };

  const handleAddTask = (e) => {
      e.preventDefault();
      const name = e.target.taskName.value.trim();
      const reward = parseInt(e.target.taskReward.value);
      const deadline = e.target.taskDeadline.value;
      if (!name || isNaN(reward) || reward <= 0) return showToast("Datos inválidos", "error");
      // Nueva tarea nace con archived: false
      setTasks(prev => [...prev, { id: Date.now(), name, reward, completed: false, inProgress: false, deadline: deadline || null, proofImage: null, archived: false }]);
      setIsAddTaskModalOpen(false);
      showToast("Tarea guardada", "info");
  };

  const handleStartTask = (id) => {
      if(isAnimating) return;
      setTasks(prev => prev.map(t => t.id === id ? {...t, inProgress: true} : {...t, inProgress: false}));
      setActiveTaskId(id); setAnimationState("chopping"); 
  };

  const triggerFileUpload = (taskId) => {
      if (isAnimating) return;
      setTaskToCompleteId(taskId);
      if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file || !taskToCompleteId) return;
      try {
          setIsAnimating(true);
          const base64Image = await convertFileToBase64(file);
          const task = tasks.find(t => t.id === taskToCompleteId);
          const reward = task ? task.reward : 0;
          setTasks(prev => prev.map(t => t.id === taskToCompleteId ? { ...t, completed: true, inProgress: false, proofImage: base64Image } : t));
          setCoins(c => c + reward);
          setActiveTaskId(null);
          showToast(`¡+${reward} monedas! Foto guardada.`, "success");
          setTimeout(() => setIsAnimating(false), 500);
      } catch (error) {
          showToast("Error al procesar imagen", "error");
          setIsAnimating(false);
      } finally {
          setTaskToCompleteId(null);
          e.target.value = "";
      }
  };

  // --- LÓGICA MODIFICADA: ARCHIVAR TODO (SOFT DELETE) ---
  const handleDeleteAllTasks = () => {
    if (isResetConfirming) {
        // Segundo click: Archivar todo (Soft Delete)
        // No borramos el array, solo marcamos 'archived: true' y quitamos 'inProgress'
        setTasks(prev => prev.map(t => ({ ...t, archived: true, inProgress: false })));
        
        setActiveTaskId(null);
        setAnimationState("idle");
        setIsResetConfirming(false);
        showToast("Lista limpiada. Datos guardados en historial.", "info");
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    } else {
        setIsResetConfirming(true);
        showToast("Click de nuevo para archivar todo.", "warning");
        resetTimeoutRef.current = setTimeout(() => {
            setIsResetConfirming(false);
        }, 3000);
    }
  };

  const handleBuyItem = (item) => {
      if(isAnimating) return;
      if(coins >= item.cost) {
          setCoins(c => c - item.cost);
          setParcelaObjects(prev => [...prev, { id: Date.now() + Math.random(), name: item.name, objectId: item.objectId, lucideIcon: item.lucideIcon, cost: item.cost, position: { top: 50, left: 50 } }]);
          showToast("Comprado", "success");
      } else showToast("Faltan monedas", "error");
  };

  const removeParcelaObject = (id) => {
      setParcelaObjects(prev => prev.filter(o => o.id !== id));
      showToast("Eliminado", "info");
  };

  const handleDragStart = (e, id, pos) => {
      if(e.button !== 0 || isAnimating) return;
      e.preventDefault(); e.stopPropagation();
      setIsDragging(true); setDraggedObjectId(id);
      if (parcelaRef.current) {
        const rect = parcelaRef.current.getBoundingClientRect();
        dragOffset.current = { x: e.clientX - (rect.left + (rect.width * pos.left / 100)), y: e.clientY - (rect.top + (rect.height * pos.top / 100)) };
      }
  };
  const handleDrag = useCallback((e) => {
      if(!isDragging || !draggedObjectId || !parcelaRef.current) return;
      const rect = parcelaRef.current.getBoundingClientRect();
      let left = Math.max(0, Math.min(100, ((e.clientX - rect.left - dragOffset.current.x) / rect.width) * 100));
      let top = Math.max(0, Math.min(100, ((e.clientY - rect.top - dragOffset.current.y) / rect.height) * 100));
      setParcelaObjects(prev => prev.map(o => o.id === draggedObjectId ? {...o, position: {top, left}} : o));
  }, [isDragging, draggedObjectId]);
  const handleDragEnd = () => { setIsDragging(false); setDraggedObjectId(null); };
  
  useEffect(() => {
      if(isDragging) { window.addEventListener('mousemove', handleDrag); window.addEventListener('mouseup', handleDragEnd); }
      else { window.removeEventListener('mousemove', handleDrag); window.removeEventListener('mouseup', handleDragEnd); }
      return () => { window.removeEventListener('mousemove', handleDrag); window.removeEventListener('mouseup', handleDragEnd); };
  }, [isDragging, handleDrag]);

  const changeThemeColor = (color, save = true) => {
      const colors = {
          indigo: { primary: "#4f46e5", bg: "#a5b4fc" }, 
          pink: { primary: "#ec4899", bg: "#f9a8d4" },   
          teal: { primary: "#0d9488", bg: "#5eead4" },   
          yellow: { primary: "#ca8a04", bg: "#fcd34d" }, 
      };
      let p, b;
      if (color.startsWith("#")) {
          p = color;
          try { const rgb = hexToRgb(color); b = `rgba(${rgb}, 0.4)`; } catch(e) { b = "#e0e7ff"; }
      } else {
          p = colors[color].primary; b = colors[color].bg;
      }
      
      document.documentElement.style.setProperty("--theme-color-primary", p);
      document.documentElement.style.setProperty("--theme-color-bg", b);
      document.documentElement.style.setProperty("--theme-rgb", hexToRgb(p));
      
      if(save && currentUser) localStorage.setItem(`${currentUser}_theme`, color);
      if(!color.startsWith("#")) setConfigDropdownOpen(false);
  };

  const getLumberjackImage = () => {
    if (animationState === "idle") return images.lumberjack.idle;
    if (animationState === "chopping") return images.lumberjack.chopping[lumberjackFrame];
    return images.lumberjack.sitting[lumberjackFrame];
  };
  
  const storeItems = [
    { name: "Perro", description: "Un fiel compañero.", cost: 150, type: "object", objectId: "perro", lucideIcon: Heart },
    { name: "Gato", description: "Un adorable gatito.", cost: 100, type: "object", objectId: "gato", lucideIcon: Cat },
    { name: "Casa", description: "Una hermosa casa.", cost: 500, type: "object", objectId: "casa", lucideIcon: Home },
  ];
  const images = {
    parcela: parcelaImg,
    lumberjack: { idle: baseImg, chopping: [trabajandoImg, trabajando2Img], sitting: [descansoImg, descanso2Img] },
    objects: { perro: perroImg, gato: gatoImg, casa: casaImg },
  };

  const DonutChart = ({ tasks }) => {
      const total = tasks.length === 0 ? 1 : tasks.length;
      const completed = tasks.filter(t => t.completed).length;
      const inProgress = tasks.filter(t => t.inProgress).length;
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
              <div key={i} className="w-full bg-indigo-200/50 rounded-t-sm hover:bg-indigo-400 transition-all relative group" style={{height: `${h}%`}}>
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
            <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url(${images.parcela})`, backgroundSize: 'cover'}}></div>
            <div className="relative z-10 bg-white/20 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/40 text-center max-w-md w-full mx-4 float-anim">
                <div className="mb-6 inline-block p-4 bg-white/30 rounded-full shadow-lg"><User size={48} className="text-white" /></div>
                <h1 className="text-5xl font-black text-white mb-1 tracking-tighter drop-shadow-md">YOTIP</h1>
                <p className="text-xs text-indigo-100 uppercase tracking-widest font-bold mb-6">Your Time, Your Productivity</p>
                <p className="text-indigo-50 mb-8 font-medium text-sm">Ingresa tu nombre para acceder a tu espacio.</p>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input autoFocus type="text" placeholder="Tu Gamertag..." value={loginName} onChange={(e) => setLoginName(e.target.value)} className="w-full px-6 py-4 rounded-xl bg-white/90 border-0 text-gray-800 font-bold text-lg placeholder-gray-400 focus:ring-4 focus:ring-indigo-400/50 transition outline-none shadow-inner text-center" />
                    <button type="submit" disabled={!loginName.trim()} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95 text-lg">Entrar</button>
                </form>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen relative font-sans text-gray-800 transition-colors duration-700" style={{ backgroundColor: 'var(--theme-color-bg)' }}>
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
        .house-size { width: 16rem; height: 16rem; }
        .standard-size { width: 6rem; height: 6rem; }
      `}</style>

      {/* INPUT DE ARCHIVO OCULTO */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

      {/* PRELOADER */}
      <div className="hidden" style={{ display: 'none' }}>
          <img src={images.lumberjack.idle} alt="preload" />
          {images.lumberjack.chopping.map((src, i) => <img key={`chop-${i}`} src={src} alt="preload" />)}
          {images.lumberjack.sitting.map((src, i) => <img key={`sit-${i}`} src={src} alt="preload" />)}
      </div>

      {/* TOAST */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${toast.visible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}>
        <div className="liquid-glass px-6 py-4 flex items-center gap-4 bg-white/60 shadow-xl">
          {toast.type === "success" ? <ThumbsUp className="text-green-600"/> : toast.type === "error" ? <AlertTriangle className="text-red-600"/> : <Info className="text-blue-600"/>}
          <p className="text-sm font-bold text-gray-900">{toast.message}</p>
        </div>
      </div>

      {/* NUEVO: MODAL DE PREVISUALIZACIÓN DE IMAGEN */}
      {previewImageSrc && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewImageSrc(null)}>
           <div className="relative max-w-3xl w-full max-h-full pop-in group" onClick={e => e.stopPropagation()}>
               <button onClick={() => setPreviewImageSrc(null)} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition z-10"><X size={20}/></button>
               <img src={previewImageSrc} alt="Evidencia Completa" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl border-2 border-white/50 bg-white" />
           </div>
        </div>
      )}

      {/* MODAL TAREA */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md liquid-glass p-8 pop-in shadow-2xl border border-white/60">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Pencil className="text-indigo-600" /> Nueva Tarea</h3>
            <form onSubmit={handleAddTask} className="space-y-5">
              <div><label className="text-xs font-bold uppercase text-gray-600 mb-1 block">Actividad</label><input name="taskName" required className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/50 transition font-medium" placeholder="Ej: Estudiar" /></div>
              <div><label className="text-xs font-bold uppercase text-gray-600 mb-1 block">Recompensa</label><input name="taskReward" type="number" required min="1" className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/50 transition font-medium" placeholder="100" /></div>
              <div><label className="text-xs font-bold uppercase text-gray-600 mb-1 block flex items-center gap-1"><Clock size={12}/> Límite</label><input name="taskDeadline" type="datetime-local" className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/50 transition font-medium" /></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setIsAddTaskModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-white/50 rounded-xl transition">Cancelar</button><button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg flex items-center gap-2">Guardar <Sparkles size={16}/></button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONTACTO */}
      {isContactOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setIsContactOpen(false)}>
            <div className="w-full max-w-sm liquid-glass p-8 pop-in shadow-2xl border-t-4 border-indigo-500 text-center bg-white/70" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4"><Mail size={32} className="text-indigo-600"/></div>
                <h3 className="text-2xl font-black text-gray-800 mb-1">Equipo 6 YOTIP</h3>
                <p className="text-sm text-gray-500 font-medium mb-6">Soporte y Desarrollo</p>
                <div className="bg-white/50 p-4 rounded-xl border border-white/50 mb-6">
                    <p className="text-indigo-600 font-bold flex items-center justify-center gap-2 text-sm"><MessageCircle size={16}/> soporte@yotip.com</p>
                </div>
                <button onClick={() => setIsContactOpen(false)} className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition">Cerrar</button>
            </div>
        </div>
      )}

      {/* SIDEBARS */}
      <aside className={`fixed inset-y-0 left-0 w-80 liquid-glass z-40 p-6 m-4 transition-transform duration-500 ${storeDrawerOpen ? "translate-x-0" : "-translate-x-[120%]"}`}>
        <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><ShoppingCart className="text-indigo-600" /> Tienda</h3><button onClick={toggleStoreDrawer} className="p-2 hover:bg-black/5 rounded-full transition"><X size={20}/></button></div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-100/80 to-orange-100/80 border border-white/50 mb-6 shadow-sm backdrop-blur-sm"><p className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">Tu Saldo</p><p className="text-4xl font-black text-yellow-600 flex items-center gap-1 tracking-tighter">{coins}<DollarSign size={28}/></p></div>
        <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
          {storeItems.map((item, i) => (
            <div key={i} className="liquid-glass-panel p-4 flex items-center justify-between group cursor-pointer"><div><div className="flex items-center gap-2 mb-1">{item.lucideIcon && <item.lucideIcon size={18} className="text-gray-800"/>} <span className="font-bold text-gray-900">{item.name}</span></div><p className="text-[10px] text-gray-600 font-medium">{item.description}</p></div><button onClick={() => handleBuyItem(item)} className="ml-2 bg-white/80 text-indigo-700 border border-indigo-100 font-bold text-xs px-3 py-2 rounded-lg shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex flex-col items-center min-w-[60px]"><span>${item.cost}</span></button></div>
          ))}
        </div>
      </aside>

      <aside className={`fixed inset-y-0 right-0 w-96 liquid-glass z-40 p-6 m-4 transition-transform duration-500 flex flex-col ${activitiesDrawerOpen ? "translate-x-0" : "translate-x-[120%]"}`}>
        <div className="flex justify-between items-center mb-8 shrink-0"><h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><ListTodo className="text-indigo-600" /> Actividades</h3><button onClick={toggleActivitiesDrawer} className="p-2 hover:bg-black/5 rounded-full transition"><X size={20}/></button></div>
        <button onClick={() => { setIsAddTaskModalOpen(true); closeAllMenus(); }} className="w-full mb-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 shrink-0"><Plus size={20} /> Crear Nueva Tarea</button>
        
        <div className="space-y-3 overflow-y-auto flex-1 pr-1 min-h-0">
          {/* FILTRO IMPORTANTE: SOLO MOSTRAR TAREAS NO ARCHIVADAS */}
          {tasks.filter(t => !t.archived).map((task) => (
            <div key={task.id} className={`relative p-4 rounded-2xl border transition-all ${task.completed ? "bg-green-50/60 border-green-200/60 opacity-90" : task.inProgress ? "bg-slate-800 border-slate-600 text-white shadow-xl scale-[1.02]" : "liquid-glass-panel"}`}>
              <div className="flex justify-between items-start mb-3">
                  <div className="w-full flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <p className={`font-bold ${task.inProgress ? "text-white" : "text-gray-900"} ${task.completed && "line-through decoration-green-500/50"}`}>{task.name}</p>
                            <p className={`text-xs font-bold ${task.inProgress ? "text-blue-300" : "text-indigo-600"} flex items-center mt-1`}>+{task.reward} Monedas</p>
                            {task.deadline && !task.completed && (
                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100/50 border border-red-200 text-[10px] font-bold text-red-600">
                                    Expira: {new Date(task.deadline).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                            )}
                        </div>
                        
                        {task.completed && task.proofImage && (
                            <div className="relative group cursor-pointer shrink-0" onClick={() => setPreviewImageSrc(task.proofImage)}>
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-4 border-green-200/50 shadow-sm transition-transform group-hover:scale-105">
                                    <img src={task.proofImage} alt="Proof" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"><Maximize2 size={24} className="text-white drop-shadow-lg"/></div>
                            </div>
                        )}
                        {task.inProgress && !task.completed && <div className="animate-pulse bg-white/20 text-white p-1.5 rounded-lg shrink-0"><Zap size={14}/></div>}
                  </div>
              </div>
              
              <div className="flex gap-2 mt-2">
                  {!task.completed ? (
                    <>
                        <button onClick={() => handleStartTask(task.id)} disabled={task.inProgress || isAnimating} className={`flex-1 py-2 border text-xs font-bold rounded-lg transition disabled:opacity-50 ${task.inProgress ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed" : "bg-white/60 border-white text-gray-700 hover:bg-blue-50 hover:text-blue-700"}`}>{task.inProgress ? "En curso..." : "Iniciar"}</button>
                        <button onClick={() => triggerFileUpload(task.id)} disabled={!task.inProgress || isAnimating} className={`flex-1 py-2 text-xs font-bold rounded-lg shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 ${task.inProgress ? "bg-white text-gray-900 hover:bg-gray-200" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}><Upload size={14}/> ¡Hecho!</button>
                    </>
                  ) : (
                    <div className="w-full py-1.5 text-center text-xs font-bold text-green-700 bg-green-100/50 border border-green-200 rounded-lg">¡Completada!</div>
                  )}
              </div>
            </div>
          ))}
        </div>

        {/* BOTÓN DE ELIMINAR TODO AL FINAL DEL DRAWER */}
        <div className="mt-4 pt-4 border-t border-gray-200/30 shrink-0">
            <button
                onClick={handleDeleteAllTasks}
                className={`w-full py-3 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                    isResetConfirming
                        ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
            >
                <Trash2 size={18} className={isResetConfirming ? "animate-bounce" : ""}/>
                {isResetConfirming ? "¿Seguro? Click para confirmar" : "Eliminar todas las tareas"}
            </button>
        </div>
      </aside>

      {/* HEADER */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-30">
        <div className="liquid-glass px-6 py-3 flex justify-between items-center shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 text-white p-2 rounded-lg shadow-lg shadow-indigo-500/30"><BarChart4 size={20}/></div>
            <div><h1 className="hidden sm:block text-lg font-black text-gray-900 tracking-tight leading-none">YOTIP</h1><span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest hidden sm:block">Your Time Your Productivity</span></div>
            <button onClick={toggleTycoonPanel} className="ml-2 text-xs font-bold text-gray-600 hover:text-indigo-700 bg-white/40 px-3 py-1.5 rounded-lg transition border border-white/50 hover:bg-white/80">Ver Datos</button>
          </div>
          <nav className="flex items-center gap-3">
            <button onClick={toggleStoreDrawer} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-indigo-700 px-3 py-2 rounded-xl hover:bg-white/50 transition"><ShoppingCart size={18}/> <span className="hidden sm:inline">Tienda</span></button>
            <button onClick={toggleActivitiesDrawer} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-indigo-700 px-3 py-2 rounded-xl hover:bg-white/50 transition"><ListTodo size={18}/> <span className="hidden sm:inline">Tareas</span></button>
            <div className="h-6 w-[1px] bg-gray-400/30 mx-2"></div>
            <div className="flex items-center gap-1 bg-yellow-100/50 border border-yellow-200/50 px-3 py-1.5 rounded-xl backdrop-blur-sm"><span className="font-black text-yellow-700">{coins}</span><DollarSign size={14} className="text-yellow-600"/></div>
            <button onClick={toggleConfig} className="p-2 text-gray-500 hover:text-indigo-700 transition hover:rotate-90 duration-300"><Settings size={20}/></button>
            <button onClick={handleLogout} className="p-2 text-red-400 hover:text-red-600 bg-red-50/50 rounded-lg transition" title="Cerrar Sesión"><LogOut size={18}/></button>
          </nav>
          {configDropdownOpen && (
            <div className="absolute top-full right-0 mt-4 w-64 liquid-glass p-5 shadow-2xl pop-in z-50">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Tema de color</p>
              <div className="flex gap-3 mb-4 justify-between">
                {['indigo','pink','teal','yellow'].map(c => (
                  <button key={c} onClick={() => changeThemeColor(c)} style={{ backgroundColor: c === 'indigo' ? '#4f46e5' : c === 'pink' ? '#ec4899' : c === 'teal' ? '#0d9488' : '#ca8a04' }} className={`w-10 h-10 rounded-full shadow-lg border-2 border-white ring-2 ring-transparent hover:scale-110 transition`}></button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-400/20"><span className="text-xs font-bold text-gray-600">Personalizado</span><div className="color-circle-wrapper"><input type="color" onChange={(e) => changeThemeColor(e.target.value)} className="color-input-fix"/></div></div>
            </div>
          )}
        </div>
      </header>

      {/* PANEL DATOS (DASHBOARD) */}
      {tycoonPanelOpen && (
        <div className="fixed inset-0 z-20 pt-28 px-4 bg-black/10 backdrop-blur-sm transition-all" onClick={() => setTycoonPanelOpen(false)}>
          <div className="max-w-6xl mx-auto liquid-glass p-8 pop-in shadow-2xl border-t-4 border-indigo-500 bg-white/80 h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
             <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-2"><Activity className="text-indigo-600"/> Actividad de {currentUser}</h2>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 mb-6">
                 <div className="bg-white/50 rounded-3xl p-6 border border-white/50 shadow-inner flex flex-col">
                     <h4 className="font-bold text-gray-600 mb-4">Actividad Semanal</h4>
                     <div className="flex-1 flex items-end justify-between gap-2 pb-4 relative"><LineChart /></div>
                     <div className="flex justify-between text-xs text-gray-400 font-bold px-2"><span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span></div>
                 </div>
                 <div className="bg-white/50 rounded-3xl p-6 border border-white/50 shadow-inner flex flex-col items-center justify-center">
                      <h4 className="font-bold text-gray-600 mb-4 w-full text-left">Estado de Tareas</h4>
                      {/* DONUT CHART USA TODAS LAS TAREAS (INCLUIDAS ARCHIVADAS) PARA MOSTRAR ESTADISTICAS TOTALES */}
                      <DonutChart tasks={tasks} />
                 </div>
             </div>

             <div className="bg-white/50 rounded-3xl p-6 border border-white/50 shadow-inner overflow-hidden flex-1 flex flex-col">
                 <div className="grid grid-cols-5 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-300/50 pb-3 mb-2">
                     <div className="flex items-center gap-1"><Calendar size={14}/> Fecha</div>
                     <div className="flex items-center gap-1 col-span-2">Nombre</div>
                     <div className="flex items-center gap-1">Progreso</div>
                     <div className="flex items-center gap-1 text-right justify-end">Dificultad</div>
                 </div>
                 <div className="overflow-y-auto pr-2 space-y-2">
                     {/* AQUI MOSTRAMOS TODAS (HISTORIAL COMPLETO) */}
                     {tasks.map(t => {
                        let starCount = Math.min(5, Math.max(1, Math.floor(t.reward / 100)));
                        if (t.reward >= 500) starCount = 5;
                        const isMaxLevel = t.reward >= 1000;
                        const starColor = isMaxLevel ? "text-purple-600" : "text-yellow-400";
                        return (
                         <div key={t.id} className={`grid grid-cols-5 gap-4 items-center py-3 border-b border-gray-200/30 hover:bg-white/40 transition rounded-lg px-2 ${t.archived ? 'opacity-50 grayscale' : ''}`}>
                             <div className="text-xs font-bold text-gray-600">{t.deadline ? new Date(t.deadline).toLocaleDateString() : "Hoy"}</div>
                             <div className="col-span-2 font-bold text-gray-800 truncate flex items-center gap-2">
                                {t.proofImage && <ImageIcon size={14} className="text-indigo-500"/>} 
                                {t.name} 
                                <span className="text-[10px] text-indigo-400 font-normal block">{currentUser} {t.archived && "(Archivado)"}</span>
                             </div>
                             <div>
                                 <div className="flex items-center gap-2">
                                     <span className="text-xs font-bold">{t.completed ? "100%" : t.inProgress ? "50%" : "0%"}</span>
                                     <div className={`w-3 h-3 rounded-full ${t.completed ? "bg-green-500" : t.inProgress ? "bg-blue-500" : "bg-gray-300"}`}></div>
                                 </div>
                             </div>
                             <div className={`flex justify-end gap-0.5 ${starColor}`}>
                                 {[...Array(starCount)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                             </div>
                         </div>
                     )})}
                     {tasks.length === 0 && <p className="text-center text-gray-400 py-4 italic text-sm">No hay actividad registrada.</p>}
                 </div>
             </div>
          </div>
        </div>
      )}

      {/* BANNER INFERIOR (PEEKING DRAWER) */}
      <div 
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-30 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) cursor-pointer ${isBannerExpanded ? 'translate-y-[-20px]' : 'translate-y-[72%]'}`}
          onClick={() => setIsBannerExpanded(!isBannerExpanded)}
      >
          <div className="liquid-glass px-6 pb-6 pt-3 shadow-2xl border-t border-white/70 bg-white/60 hover:bg-white/70 transition-colors">
              <div className="w-16 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 opacity-60"></div>
              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full"><HelpCircle size={20}/></div>
                      <div><p className="text-sm font-bold text-gray-800">Centro de Ayuda</p><p className="text-xs text-gray-500">Guía rápida y soporte</p></div>
                  </div>
                  <div className="transform transition-transform duration-500" style={{transform: isBannerExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}}><ChevronUp size={20} className="text-gray-400"/></div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200/50 flex justify-between items-center opacity-90">
                  <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>1.</strong> Inicia tareas para activar al leñador.</p>
                      <p><strong>2.</strong> Sube tu evidencia antes de que expire.</p>
                      <p><strong>3.</strong> ¡Cuidado! Si expira pierdes monedas.</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setIsContactOpen(true); }} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition flex items-center gap-2">Soporte <Mail size={14}/></button>
              </div>
          </div>
      </div>

      {/* MAIN PARCELA */}
      <main className="pt-32 pb-20 px-4 min-h-screen flex items-center justify-center overflow-hidden">
        <div ref={parcelaRef} className="relative w-full max-w-6xl aspect-video liquid-glass p-0 shadow-2xl group overflow-hidden">
            <div className="absolute inset-0 bg-no-repeat bg-center opacity-90" style={{ backgroundImage: `url(${images.parcela})`, backgroundSize: '90%' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent pointer-events-none"></div>

            {parcelaObjects.length === 0 && animationState === "idle" && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"><div className="liquid-glass px-8 py-6 text-center animate-pulse bg-white/60"><Home size={48} className="mx-auto text-indigo-600 mb-2 opacity-80"/><h2 className="text-xl font-black text-gray-800">Parcela Vacía</h2><p className="text-sm text-gray-600 font-medium">Ve a la tienda y comienza a decorar</p></div></div>
            )}

            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-500">
                <div className="relative">
                    <img key={getLumberjackImage()} src={getLumberjackImage()} alt="Leñador" className="h-32 object-contain drop-shadow-2xl" style={{ imageRendering: "pixelated" }} />
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-1 rounded-xl shadow-lg border-2 border-white transform hover:scale-110 transition flex flex-col items-center">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Jugador</span>
                        <span className="text-sm font-black text-gray-800 leading-none pb-1">{currentUser}</span>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-3 py-1 rounded-full shadow-lg text-[10px] font-bold text-white whitespace-nowrap flex items-center gap-1 border border-white/20">
                        {animationState === "idle" && <>💤 Esperando...</>}{animationState === "chopping" && <><Zap size={10} className="text-yellow-400"/> Trabajando</>}{animationState === "sitting" && <><Sparkles size={10} className="text-indigo-300"/> Descansando</>}
                    </div>
                </div>
            </div>

            {parcelaObjects.map((obj) => (
                <div 
                    key={obj.id}
                    className={`absolute transition-transform active:scale-95 ${isDragging && draggedObjectId === obj.id ? "z-50 cursor-grabbing scale-110" : "z-10 cursor-grab hover:z-20"}`}
                    style={{ top: `${obj.position.top}%`, left: `${obj.position.left}%`, transform: 'translate(-50%, -50%)' }}
                    onMouseDown={(e) => handleDragStart(e, obj.id, obj.position)}
                >
                    <div className="relative group/obj">
                        <img src={images.objects[obj.objectId]} className={`${obj.objectId === "casa" ? "h-48 drop-shadow-2xl" : "h-20 drop-shadow-xl"} object-contain transition filter group-hover/obj:brightness-110`} style={{ imageRendering: "pixelated" }} draggable="false" />
                        {!isDragging && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover/obj:opacity-100 transition-all transform translate-y-2 group-hover/obj:translate-y-0">
                                <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => {e.stopPropagation(); removeParcelaObject(obj.id)}} className="bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition border-2 border-white"><X size={12}/></button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}

export default App;