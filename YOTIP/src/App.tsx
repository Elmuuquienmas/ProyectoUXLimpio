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
  Clock 
} from "lucide-react";

// --- IMPORTACIÓN DE IMÁGENES ---
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

function getInitialParcelaObjects() {
  try {
    const saved = localStorage.getItem("parcelaObjects");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.every(obj => obj.position && typeof obj.position.top === 'number') ? parsed : [];
  } catch (e) {
    return [];
  }
}

function App() {
  // --- ESTADOS ---
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem("totalCoins");
    return saved ? parseInt(saved) : 5000;
  });
  
  const [parcelaObjects, setParcelaObjects] = useState(getInitialParcelaObjects);
  const [storeDrawerOpen, setStoreDrawerOpen] = useState(false);
  const [activitiesDrawerOpen, setActivitiesDrawerOpen] = useState(false);
  const [configDropdownOpen, setConfigDropdownOpen] = useState(false);
  const [tycoonPanelOpen, setTycoonPanelOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationState, setAnimationState] = useState("idle");
  const [lumberjackFrame, setLumberjackFrame] = useState(0);
  
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tycoonTasks");
    if (savedTasks) return JSON.parse(savedTasks);
    return [
      { id: 1, name: "Leer 1 artículo (Simple)", reward: 10, completed: false, inProgress: false, deadline: null },
      { id: 2, name: "Organizar la bandeja de entrada", reward: 25, completed: false, inProgress: false, deadline: null },
      { id: 3, name: "Ejercicio de 30 minutos", reward: 50, completed: false, inProgress: false, deadline: null },
    ];
  });

  const [activeTaskId, setActiveTaskId] = useState(null);

  // --- DRAG & DROP ---
  const [isDragging, setIsDragging] = useState(false);
  const [draggedObjectId, setDraggedObjectId] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const parcelaRef = useRef(null);

  // --- UI ---
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false, type: "success" });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4000);
  }, []);

  const images = {
    parcela: parcelaImg,
    lumberjack: { idle: baseImg, chopping: [trabajandoImg, trabajando2Img], sitting: [descansoImg, descanso2Img] },
    objects: { perro: perroImg, gato: gatoImg, casa: casaImg },
  };

  const storeItems = [
    { name: "Perro", description: "Un fiel compañero.", cost: 150, type: "object", objectId: "perro", lucideIcon: Heart },
    { name: "Gato", description: "Un adorable gatito.", cost: 100, type: "object", objectId: "gato", lucideIcon: Cat },
    { name: "Casa", description: "Una hermosa casa.", cost: 500, type: "object", objectId: "casa", lucideIcon: Home },
  ];

  // --- EFFECTS ---
  useEffect(() => { localStorage.setItem("totalCoins", coins.toString()); }, [coins]);
  useEffect(() => { if (Array.isArray(parcelaObjects)) localStorage.setItem("parcelaObjects", JSON.stringify(parcelaObjects)); }, [parcelaObjects]);
  useEffect(() => { localStorage.setItem("tycoonTasks", JSON.stringify(tasks)); }, [tasks]);

  useEffect(() => {
    const timer = setInterval(() => {
        const now = new Date();
        setTasks(prev => prev.filter(t => {
            if (t.completed) return true;
            if (!t.deadline) return true;
            return new Date(t.deadline) > now;
        }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval;
    if (animationState === "chopping") interval = setInterval(() => setLumberjackFrame((prev) => (prev + 1) % 2), 300);
    else if (animationState === "sitting") interval = setInterval(() => setLumberjackFrame((prev) => (prev + 1) % 2), 500);
    else setLumberjackFrame(0);
    return () => { if (interval) clearInterval(interval); };
  }, [animationState]);

  useEffect(() => {
    const hasAnyTaskInProgress = tasks.some((t) => t.inProgress);
    if (activeTaskId === null && !hasAnyTaskInProgress && animationState === "chopping") {
      setIsAnimating(true);
      setAnimationState("sitting");
      const timeout = setTimeout(() => { setAnimationState("idle"); setIsAnimating(false); }, 2000);
      return () => clearTimeout(timeout);
    } else if (hasAnyTaskInProgress && animationState !== "chopping") {
      setAnimationState("chopping");
    }
  }, [activeTaskId, tasks, animationState]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape") { closeAll(); setIsAddTaskModalOpen(false); } };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const closeAll = () => {
    setStoreDrawerOpen(false); setActivitiesDrawerOpen(false); setConfigDropdownOpen(false); setTycoonPanelOpen(false);
  };

  const openStoreDrawer = () => { closeAll(); setStoreDrawerOpen(true); };
  const openActivitiesDrawer = () => { closeAll(); setActivitiesDrawerOpen(true); };
  
  const toggleConfig = () => { setStoreDrawerOpen(false); setActivitiesDrawerOpen(false); setTycoonPanelOpen(false); setConfigDropdownOpen(!configDropdownOpen); };
  const toggleTycoonPanel = () => { setStoreDrawerOpen(false); setActivitiesDrawerOpen(false); setConfigDropdownOpen(false); setTycoonPanelOpen(!tycoonPanelOpen); };

  const handleAddTask = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.taskName.value.trim();
    const reward = parseInt(form.taskReward.value);
    const deadline = form.taskDeadline.value; 

    if (!name || isNaN(reward) || reward <= 0) {
      showToast("Datos inválidos.", "error");
      return;
    }
    const newTask = { id: Date.now(), name: name, reward: reward, completed: false, inProgress: false, deadline: deadline || null };
    setTasks((prev) => [...prev, newTask]);
    setIsAddTaskModalOpen(false);
    showToast("Tarea agregada", "info");
  };

  const handleStartTask = (taskId) => {
    if (isAnimating) return;
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, inProgress: true } : { ...t, inProgress: false }));
    setActiveTaskId(taskId);
    setAnimationState("chopping");
    closeAll();
    showToast("¡A trabajar!", "info");
  };

  const handleCompleteTask = (taskId, reward) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, completed: true, inProgress: false } : t));
    setCoins((prev) => prev + reward);
    setActiveTaskId(null);
    showToast(`¡Hecho! +${reward}`, "success");
    setTimeout(() => { setIsAnimating(false); }, 500);
  };

  const handleBuyItem = (item) => {
    if (isAnimating) return;
    if (coins >= item.cost) {
      setCoins(c => c - item.cost);
      setParcelaObjects([...parcelaObjects, { id: Date.now() + Math.random(), name: item.name, objectId: item.objectId, lucideIcon: item.lucideIcon, cost: item.cost, position: { top: 50, left: 50 } }]);
      showToast("Comprado", "success");
    } else {
      showToast("Faltan monedas", "error");
    }
  };

  const removeParcelaObject = (objectId) => {
    setParcelaObjects(prev => prev.filter((obj) => obj.id !== objectId));
    showToast("Eliminado", "info");
  };

  const handleResetData = () => {
    if(confirm("¿Resetear todo?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const updateParcelaObjectPosition = useCallback((id, newPosition) => {
    setParcelaObjects(prev => prev.map(obj => obj.id === id ? { ...obj, position: newPosition } : obj));
  }, []);

  const handleDragStart = (e, id, objPosition) => {
    if (e.button !== 0 || isAnimating) return; 
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true); setDraggedObjectId(id);
    if (parcelaRef.current) {
        const rect = parcelaRef.current.getBoundingClientRect();
        const cx = (rect.width * objPosition.left) / 100;
        const cy = (rect.height * objPosition.top) / 100;
        dragOffset.current = { x: e.clientX - (rect.left + cx), y: e.clientY - (rect.top + cy) };
    }
  };

  const handleDrag = useCallback((e) => {
    if (!isDragging || !draggedObjectId || !parcelaRef.current) return;
    const rect = parcelaRef.current.getBoundingClientRect();
    const nx = e.clientX - rect.left - dragOffset.current.x;
    const ny = e.clientY - rect.top - dragOffset.current.y;
    let nl = Math.max(0, Math.min(100, (nx / rect.width) * 100));
    let nt = Math.max(0, Math.min(100, (ny / rect.height) * 100));
    updateParcelaObjectPosition(draggedObjectId, { top: nt, left: nl });
  }, [isDragging, draggedObjectId, updateParcelaObjectPosition]);

  const handleDragEnd = useCallback(() => { setIsDragging(false); setDraggedObjectId(null); }, []);

  useEffect(() => {
    if (isDragging) { window.addEventListener('mousemove', handleDrag); window.addEventListener('mouseup', handleDragEnd); }
    else { window.removeEventListener('mousemove', handleDrag); window.removeEventListener('mouseup', handleDragEnd); }
    return () => { window.removeEventListener('mousemove', handleDrag); window.removeEventListener('mouseup', handleDragEnd); };
  }, [isDragging, handleDrag, handleDragEnd]);

  // --- CORRECCIÓN SELECTOR DE COLOR ---
  const changeThemeColor = (color) => {
    let primaryHex, bgHex;
    const colors = {
        indigo: { primary: "#4f46e5", bg: "#a5b4fc" }, 
        pink: { primary: "#ec4899", bg: "#f9a8d4" },   
        teal: { primary: "#0d9488", bg: "#5eead4" },   
        yellow: { primary: "#ca8a04", bg: "#fcd34d" }, 
    };

    if (color.startsWith("#")) {
        primaryHex = color;
        // Aquí está el arreglo: creamos un fondo semitransparente basado en el color personalizado
        try {
            const rgb = hexToRgb(color);
            bgHex = `rgba(${rgb}, 0.3)`; // 30% de opacidad del color elegido
        } catch(e) {
            bgHex = "#e0e7ff";
        }
    } else {
        primaryHex = colors[color].primary;
        bgHex = colors[color].bg;
    }

    const rgbValues = hexToRgb(primaryHex);
    const root = document.documentElement;
    root.style.setProperty("--theme-color-primary", primaryHex);
    root.style.setProperty("--theme-color-bg", bgHex);
    root.style.setProperty("--theme-rgb", rgbValues);

    if (!color.startsWith("#")) setConfigDropdownOpen(false);
    showToast("Tema actualizado", "info");
  };

  const handleCustomColorChange = (event) => { changeThemeColor(event.target.value); };
  useEffect(() => { changeThemeColor("indigo"); }, []);

  const getLumberjackImage = () => {
    if (animationState === "idle") return images.lumberjack.idle;
    if (animationState === "chopping") return images.lumberjack.chopping[lumberjackFrame];
    return images.lumberjack.sitting[lumberjackFrame];
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "success": return <ThumbsUp className="w-5 h-5 text-green-600" />;
      case "error": return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const formatDate = (dateString) => {
      if(!dateString) return "";
      return new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  return (
    <div className="min-h-screen relative font-sans text-gray-800 transition-colors duration-500" style={{ backgroundColor: 'var(--theme-color-bg)' }}>
      <style>{`
        @keyframes popIn { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .pop-in { animation: popIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        .float { animation: float 4s ease-in-out infinite; }

        :root { --theme-color-primary: #4f46e5; --theme-color-bg: #a5b4fc; --theme-rgb: 79, 70, 229; }

        /* iOS Glass Style Mejorado */
        .liquid-glass { 
            background: rgba(255, 255, 255, 0.55); 
            backdrop-filter: blur(24px) saturate(200%);
            -webkit-backdrop-filter: blur(24px) saturate(200%);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
            border-radius: 24px;
        }
        .liquid-glass-panel { 
            background: rgba(255, 255, 255, 0.5); 
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 16px;
            transition: all 0.2s ease;
        }
        .liquid-glass-panel:hover {
            background: rgba(255, 255, 255, 0.7);
            box-shadow: 0 4px 20px rgba(var(--theme-rgb), 0.2);
            transform: translateY(-2px);
            border-color: var(--theme-color-primary);
        }

        .color-input-button { -webkit-appearance: none; border: 3px solid white; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; padding: 0; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .color-input-button::-webkit-color-swatch { border: none; }

        .parcela-object { position: absolute; transform: translate(-50%, -50%); cursor: grab; user-select: none; transition: transform 0.1s; }
        .parcela-object:active { cursor: grabbing; transform: translate(-50%, -50%) scale(0.95); }
        .parcela-object.dragging { opacity: 0.8; z-index: 50; transition: none; }
        .house-size { width: 16rem; height: 16rem; }
        .standard-size { width: 6rem; height: 6rem; }
      `}</style>

      {/* MODAL */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md liquid-glass p-8 pop-in shadow-2xl border border-white/60">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Pencil className="text-indigo-600" /> Nueva Tarea</h3>
            <form onSubmit={handleAddTask} className="space-y-5">
              <div><label className="text-xs font-bold uppercase text-gray-600 mb-1 block">Actividad</label><input name="taskName" required className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/50 transition" /></div>
              <div><label className="text-xs font-bold uppercase text-gray-600 mb-1 block">Recompensa</label><input name="taskReward" type="number" required min="1" className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/50 transition" /></div>
              <div><label className="text-xs font-bold uppercase text-gray-600 mb-1 block flex items-center gap-1"><Clock size={12}/> Límite</label><input name="taskDeadline" type="datetime-local" className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-500/50 transition" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddTaskModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-white/50 rounded-xl transition">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2">Guardar <Sparkles size={16}/></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ${toast.visible ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"}`}>
        <div className="liquid-glass px-6 py-4 flex items-center gap-4 bg-white/60">
          {getToastIcon(toast.type)}
          <p className="text-sm font-bold text-gray-900">{toast.message}</p>
        </div>
      </div>

      {/* TIENDA */}
      <aside className={`fixed inset-y-0 left-0 w-80 liquid-glass z-40 p-6 m-4 transition-transform duration-500 ${storeDrawerOpen ? "translate-x-0" : "-translate-x-[120%]"}`}>
        <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><ShoppingCart className="text-indigo-600" /> Tienda</h3><button onClick={() => setStoreDrawerOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition"><X size={20} className="text-gray-600"/></button></div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-100/80 to-orange-100/80 border border-white/50 mb-6 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">Tu Saldo</p>
          <p className="text-4xl font-black text-yellow-600 flex items-center gap-1 tracking-tighter">{coins}<DollarSign size={28}/></p>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
          {storeItems.map((item, i) => {
            const Icon = item.lucideIcon;
            return (
              <div key={i} className="liquid-glass-panel p-4 flex items-center justify-between group cursor-pointer">
                <div><div className="flex items-center gap-2 mb-1">{Icon && <Icon size={18} className="text-gray-800"/>} <span className="font-bold text-gray-900">{item.name}</span></div><p className="text-[10px] text-gray-600 font-medium">{item.description}</p></div>
                <button onClick={() => handleBuyItem(item)} className="ml-2 bg-white/80 text-indigo-700 border border-indigo-100 font-bold text-xs px-3 py-2 rounded-lg shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex flex-col items-center min-w-[60px]"><span>${item.cost}</span></button>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ACTIVIDADES */}
      <aside className={`fixed inset-y-0 right-0 w-96 liquid-glass z-40 p-6 m-4 transition-transform duration-500 ${activitiesDrawerOpen ? "translate-x-0" : "translate-x-[120%]"}`}>
        <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><ListTodo className="text-indigo-600" /> Actividades</h3><button onClick={() => setActivitiesDrawerOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition"><X size={20} className="text-gray-600"/></button></div>
        <button onClick={() => { setIsAddTaskModalOpen(true); closeAll(); }} className="w-full mb-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition transform active:scale-95"><Plus size={20} /> Crear Nueva Tarea</button>
        <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
          {tasks.map((task) => (
            <div key={task.id} className={`relative p-4 rounded-2xl border transition-all ${task.completed ? "bg-green-50/60 border-green-200/60 opacity-70" : task.inProgress ? "bg-blue-50/80 border-blue-200 shadow-md scale-[1.02]" : "liquid-glass-panel"}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className={`font-bold text-gray-900 ${task.completed && "line-through decoration-2 decoration-green-500/50"}`}>{task.name}</p>
                  <p className="text-xs font-bold text-indigo-600 flex items-center mt-1">+{task.reward} Monedas</p>
                  {task.deadline && !task.completed && <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100/50 border border-red-200 text-[10px] font-bold text-red-600"><Clock size={10}/> Expira: {formatDate(task.deadline)}</div>}
                  {task.deadline && task.completed && <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-green-700"><Check size={10}/> A tiempo</div>}
                </div>
                {task.inProgress && <div className="animate-pulse bg-blue-500 text-white p-1.5 rounded-lg shadow-lg shadow-blue-500/40"><Zap size={14}/></div>}
              </div>
              <div className="flex gap-2 mt-2">
                 {!task.completed ? (
                     <>
                        <button onClick={() => handleStartTask(task.id)} disabled={task.inProgress || isAnimating} className="flex-1 py-2 bg-white/60 border border-white text-gray-700 text-xs font-bold rounded-lg hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-50">{task.inProgress ? "En curso..." : "Iniciar"}</button>
                        <button onClick={() => handleCompleteTask(task.id, task.reward)} disabled={!task.inProgress || isAnimating} className="flex-1 py-2 bg-green-500 text-white text-xs font-bold rounded-lg shadow-md hover:bg-green-600 transition disabled:opacity-50 disabled:bg-gray-400">¡Hecho!</button>
                     </>
                 ) : (<div className="w-full py-1.5 text-center text-xs font-bold text-green-700 bg-green-100/50 border border-green-200 rounded-lg">¡Completada!</div>)}
              </div>
            </div>
          ))}
        </div>
        {tasks.some(t => t.completed) && <button onClick={() => {if(confirm("¿Borrar terminadas?")) setTasks(p => p.filter(t => !t.completed))}} className="w-full mt-4 text-xs text-gray-500 hover:text-red-600 font-bold transition text-center underline decoration-gray-400/50">Limpiar historial</button>}
      </aside>

      {/* HEADER */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-30">
        <div className="liquid-glass px-6 py-3 flex justify-between items-center shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 text-white p-2 rounded-lg shadow-lg shadow-indigo-500/30"><BarChart4 size={20}/></div>
            <h1 className="hidden sm:block text-lg font-black text-gray-900 tracking-tight">TYCOON <span className="text-indigo-600">TAREAS</span></h1>
            <button onClick={toggleTycoonPanel} className="ml-2 text-xs font-bold text-gray-600 hover:text-indigo-700 bg-white/40 px-3 py-1.5 rounded-lg transition border border-white/50 hover:bg-white/80">Ver Estadísticas</button>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <button onClick={openStoreDrawer} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-indigo-700 px-3 py-2 rounded-xl hover:bg-white/50 transition"><ShoppingCart size={18}/> <span className="hidden sm:inline">Tienda</span></button>
            <button onClick={openActivitiesDrawer} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-indigo-700 px-3 py-2 rounded-xl hover:bg-white/50 transition"><ListTodo size={18}/> <span className="hidden sm:inline">Tareas</span></button>
            <div className="h-6 w-[1px] bg-gray-400/30 mx-2"></div>
            <div className="flex items-center gap-1 bg-yellow-100/50 border border-yellow-200/50 px-3 py-1.5 rounded-xl backdrop-blur-sm"><span className="font-black text-yellow-700">{coins}</span><DollarSign size={14} className="text-yellow-600"/></div>
            <button onClick={toggleConfig} className="p-2 text-gray-500 hover:text-indigo-700 transition hover:rotate-90 duration-300"><Settings size={20}/></button>
            <button onClick={handleResetData} className="p-2 text-gray-400 hover:text-red-500 transition"><Trash2 size={18}/></button>
          </nav>
          {configDropdownOpen && (
            <div className="absolute top-full right-0 mt-4 w-64 liquid-glass p-5 shadow-2xl pop-in z-50">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Tema de color</p>
              <div className="flex gap-3 mb-4 justify-between">
                {['indigo','pink','teal','yellow'].map(c => (<button key={c} onClick={() => changeThemeColor(c)} className={`w-10 h-10 rounded-full shadow-lg border-2 border-white ring-2 ring-transparent hover:scale-110 transition bg-${c === 'indigo' ? 'indigo-600' : c === 'pink' ? 'pink-600' : c === 'teal' ? 'teal-600' : 'yellow-600'}`}></button>))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-400/20"><span className="text-xs font-bold text-gray-600">Personalizado</span><input type="color" onChange={handleCustomColorChange} className="color-input-button"/></div>
            </div>
          )}
        </div>
      </header>

      {/* PANEL DATOS */}
      {tycoonPanelOpen && (
        <div className="fixed inset-0 z-20 pt-28 px-4 bg-black/10 backdrop-blur-sm transition-all">
          <div className="max-w-5xl mx-auto liquid-glass p-8 pop-in shadow-2xl border-t-4 border-indigo-500 bg-white/80">
             <h2 className="text-3xl font-black text-gray-800 mb-2">Tu Progreso</h2>
             <p className="text-gray-500 mb-8 font-medium">Resumen general de tu parcela y economía.</p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-100 shadow-sm"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-yellow-200 text-yellow-700 rounded-lg"><DollarSign size={24}/></div><span className="text-sm font-bold text-yellow-800/60 uppercase">Economía</span></div><p className="text-4xl font-black text-yellow-600">{coins}</p></div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-indigo-200 text-indigo-700 rounded-lg"><Home size={24}/></div><span className="text-sm font-bold text-indigo-800/60 uppercase">Decoración</span></div><p className="text-4xl font-black text-indigo-600">{parcelaObjects.length} <span className="text-lg text-indigo-400">objetos</span></p></div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 shadow-sm"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-green-200 text-green-700 rounded-lg"><Check size={24}/></div><span className="text-sm font-bold text-green-800/60 uppercase">Productividad</span></div><p className="text-4xl font-black text-green-600">{tasks.filter(t=>t.completed).length} <span className="text-lg text-green-400">tareas</span></p></div>
             </div>
          </div>
        </div>
      )}

      {/* MAIN - PARCELA (CORREGIDO TAMAÑO DE IMAGEN Y BORRAR OBJETOS) */}
      <main className="pt-32 pb-10 px-4 min-h-screen flex items-center justify-center overflow-hidden">
        <div ref={parcelaRef} className="relative w-full max-w-6xl aspect-video liquid-glass p-0 shadow-2xl group overflow-hidden">
            {/* IMAGEN FONDO: 90% PARA QUE SE VEA BIEN SIN CORTES */}
            <div className="absolute inset-0 bg-no-repeat bg-center opacity-90" style={{ backgroundImage: `url(${images.parcela})`, backgroundSize: '90%' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent pointer-events-none"></div>

            {parcelaObjects.length === 0 && animationState === "idle" && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"><div className="liquid-glass px-8 py-6 text-center animate-pulse bg-white/60"><Home size={48} className="mx-auto text-indigo-600 mb-2 opacity-80"/><h2 className="text-xl font-black text-gray-800">Parcela Vacía</h2><p className="text-sm text-gray-600 font-medium">Ve a la tienda y comienza a decorar</p></div></div>
            )}

            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-500">
                <div className="relative"><img src={getLumberjackImage()} alt="Leñador" className="h-32 object-contain drop-shadow-2xl" style={{ imageRendering: "pixelated" }} /><div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full shadow-lg text-xs font-bold text-gray-700 whitespace-nowrap flex items-center gap-1.5 border border-white">{animationState === "idle" && <>💤 Esperando órdenes...</>}{animationState === "chopping" && <><Zap size={12} className="text-yellow-500"/> ¡Trabajando duro!</>}{animationState === "sitting" && <><Sparkles size={12} className="text-indigo-500"/> Descansando...</>}</div></div>
            </div>

            {/* OBJETOS CON FIX DE BORRADO */}
            {parcelaObjects.map((obj) => (
                <div 
                    key={obj.id}
                    className={`absolute transition-transform active:scale-95 ${isDragging && draggedObjectId === obj.id ? "z-50 cursor-grabbing scale-110" : "z-10 cursor-grab hover:z-20"}`}
                    style={{ top: `${obj.position.top}%`, left: `${obj.position.left}%`, transform: 'translate(-50%, -50%)' }}
                    onMouseDown={(e) => handleDragStart(e, obj.id, obj.position)}
                >
                    <div className="relative group/obj">
                        <img src={images.objects[obj.objectId]} className={`${obj.objectId === "casa" ? "h-48 drop-shadow-2xl" : "h-20 drop-shadow-xl"} object-contain transition filter group-hover/obj:brightness-110`} style={{ imageRendering: "pixelated" }} draggable="false" />
                        {/* BOTÓN BORRAR: onMouseDown Detiene propagación para que no inicie drag */}
                        {!isDragging && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover/obj:opacity-100 transition-all transform translate-y-2 group-hover/obj:translate-y-0">
                                <button 
                                    onMouseDown={(e) => e.stopPropagation()} 
                                    onClick={(e) => {e.stopPropagation(); removeParcelaObject(obj.id)}} 
                                    className="bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition border-2 border-white"
                                >
                                    <X size={12}/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
                <div className="liquid-glass-panel p-3 flex items-center gap-3 shadow-sm bg-white/60"><div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg"><Home size={16}/></div><div><p className="text-[10px] font-bold text-gray-400 uppercase">Objetos</p><p className="text-sm font-black text-gray-800">{parcelaObjects.length}</p></div></div>
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;