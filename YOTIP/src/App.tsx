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
  Trash2
} from "lucide-react";

// --- IMPORTACIÓN DE TUS IMÁGENES LOCALES ---
// Asegúrate de que estos archivos existen en src/assets/
import parcelaImg from './assets/parcela.png';
import baseImg from './assets/base.png';
import trabajandoImg from './assets/trabajando.png';
import trabajando2Img from './assets/trabajando2.png';
import descansoImg from './assets/descanso.png';
import descanso2Img from './assets/descanso2.png';
import perroImg from './assets/perro.png';
import gatoImg from './assets/gato.png';
import casaImg from './assets/casa.png';

// --- MAPA DE ICONOS (SOLUCIÓN CRÍTICA) ---
// Esto evita el error de "object" al guardar en localStorage
const ICON_MAP = {
  perro: Heart,
  gato: Cat,
  casa: Home
};

// --- UTILIDADES ---
function hexToRgb(hex) {
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
  const expandedHex =
    cleanHex.length === 3
      ? cleanHex.split("").map((char) => char + char).join("")
      : cleanHex;
  const bigint = parseInt(expandedHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

// --- CARGA SEGURA DE DATOS ---
function getInitialParcelaObjects() {
  try {
    const saved = localStorage.getItem("parcelaObjects");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    // Limpieza de seguridad: eliminamos propiedades que causan error y verificamos posición
    const cleanData = parsed.map(obj => {
        // Si el objeto tiene 'lucideIcon' guardado, lo borramos (es lo que causa el error de React)
        // eslint-disable-next-line no-unused-vars
        const { lucideIcon, ...rest } = obj;
        
        // Aseguramos que tenga posición válida
        if (!rest.position || typeof rest.position.top !== 'number') {
             return { ...rest, position: { top: 50, left: 50 } };
        }
        return rest;
    });

    return cleanData;
  } catch (e) {
    console.error("Error cargando datos, reiniciando...", e);
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
  
  // Estados de UI
  const [storeDrawerOpen, setStoreDrawerOpen] = useState(false);
  const [activitiesDrawerOpen, setActivitiesDrawerOpen] = useState(false);
  const [configDropdownOpen, setConfigDropdownOpen] = useState(false);
  const [tycoonPanelOpen, setTycoonPanelOpen] = useState(false); // <--- AQUÍ ESTÁ EL ESTADO
  
  // Estados de Animación
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationState, setAnimationState] = useState("idle");
  const [lumberjackFrame, setLumberjackFrame] = useState(0);
  
  // Tareas
  const [tasks, setTasks] = useState([
    { id: 1, name: "Leer 1 artículo", reward: 10, completed: false, inProgress: false },
    { id: 2, name: "Organizar correo", reward: 25, completed: false, inProgress: false },
    { id: 3, name: "Ejercicio 30 min", reward: 50, completed: false, inProgress: false },
  ]);
  const [activeTaskId, setActiveTaskId] = useState(null);

  // Estados Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const [draggedObjectId, setDraggedObjectId] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const parcelaRef = useRef(null);

  // Estados Modal/Toast
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false, type: "success" });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4000);
  }, []);

  // --- DEFINICIÓN DE IMÁGENES Y TIENDA ---
  const images = {
    parcela: parcelaImg,
    lumberjack: {
      idle: baseImg,
      chopping: [trabajandoImg, trabajando2Img],
      sitting: [descansoImg, descanso2Img],
    },
    objects: {
      perro: perroImg,
      gato: gatoImg,
      casa: casaImg,
    },
  };

  const storeItems = [
    { name: "Perro", description: "Un fiel compañero.", cost: 150, objectId: "perro" },
    { name: "Gato", description: "Un adorable gatito.", cost: 100, objectId: "gato" },
    { name: "Casa", description: "Una hermosa casa.", cost: 500, objectId: "casa" },
  ];

  // --- EFFECTS (GUARDADO Y ANIMACIÓN) ---
  useEffect(() => { localStorage.setItem("totalCoins", coins.toString()); }, [coins]);
  
  useEffect(() => { 
      // Guardamos solo los datos seguros (sin componentes de React)
      localStorage.setItem("parcelaObjects", JSON.stringify(parcelaObjects)); 
  }, [parcelaObjects]);

  useEffect(() => {
    let interval;
    if (animationState === "chopping") interval = setInterval(() => setLumberjackFrame(p => (p + 1) % 2), 300);
    else if (animationState === "sitting") interval = setInterval(() => setLumberjackFrame(p => (p + 1) % 2), 500);
    else setLumberjackFrame(0);
    return () => clearInterval(interval);
  }, [animationState]);

  useEffect(() => {
    const working = tasks.some(t => t.inProgress);
    if (!activeTaskId && !working && animationState === "chopping") {
      setIsAnimating(true); setAnimationState("sitting");
      setTimeout(() => { setAnimationState("idle"); setIsAnimating(false); }, 2000);
    } else if (working && animationState !== "chopping") {
      setAnimationState("chopping");
    }
  }, [activeTaskId, tasks, animationState]);

  // --- FUNCIONES DE UI (DEFINIDAS ANTES DEL RETURN) ---
  
  // Función para cerrar todos los paneles
  const closeAll = () => {
    setStoreDrawerOpen(false);
    setActivitiesDrawerOpen(false);
    setConfigDropdownOpen(false);
    setTycoonPanelOpen(false);
  };

  // Función para abrir el panel de Tycoon (LA QUE TE DABA ERROR)
  const toggleTycoonPanel = () => {
    setStoreDrawerOpen(false);
    setActivitiesDrawerOpen(false);
    setConfigDropdownOpen(false);
    setTycoonPanelOpen(!tycoonPanelOpen);
  };

  const openStoreDrawer = () => { closeAll(); setStoreDrawerOpen(true); };
  const openActivitiesDrawer = () => { closeAll(); setActivitiesDrawerOpen(true); };
  
  const toggleConfig = () => {
    setStoreDrawerOpen(false);
    setActivitiesDrawerOpen(false);
    setTycoonPanelOpen(false);
    setConfigDropdownOpen(!configDropdownOpen);
  };

  // --- FUNCIONES DE LÓGICA DE JUEGO ---
  const handleBuyItem = (item) => {
    if (isAnimating) return;
    if (coins >= item.cost) {
      setCoins(c => c - item.cost);
      const newObject = {
        id: Date.now() + Math.random(),
        name: item.name,
        objectId: item.objectId,
        cost: item.cost,
        position: { top: 50, left: 50 }, // Posición inicial centro
      };
      setParcelaObjects([...parcelaObjects, newObject]);
      showToast(`¡${item.name} comprado!`, "success");
    } else {
      showToast("Faltan monedas", "error");
    }
  };

  const removeParcelaObject = (id) => {
    setParcelaObjects(prev => prev.filter(o => o.id !== id));
    showToast("Objeto eliminado", "info");
  };

  const handleResetData = () => {
    if(confirm("¿Reiniciar todo? Se borrará el progreso.")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const handleAddTask = (e) => {
      e.preventDefault();
      const name = e.target.taskName.value;
      const reward = parseInt(e.target.taskReward.value);
      setTasks([...tasks, { id: Date.now(), name, reward, completed: false, inProgress: false }]);
      setIsAddTaskModalOpen(false);
  };

  const handleStartTask = (id) => {
      if(isAnimating) return;
      setTasks(tasks.map(t => t.id === id ? {...t, inProgress: true} : {...t, inProgress: false}));
      setActiveTaskId(id);
      setAnimationState("chopping");
      closeAll();
  };

  const handleCompleteTask = (id, reward) => {
      if(isAnimating) return;
      setIsAnimating(true);
      setTasks(tasks.map(t => t.id === id ? {...t, completed: true, inProgress: false} : t));
      setCoins(c => c + reward);
      setActiveTaskId(null);
      showToast("¡Tarea completada!", "success");
      setTimeout(() => setIsAnimating(false), 500);
  };

  // --- DRAG & DROP ---
  const handleDragStart = (e, id, pos) => {
    if (e.button !== 0 || isAnimating) return;
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true); setDraggedObjectId(id);
    if (parcelaRef.current) {
        const rect = parcelaRef.current.getBoundingClientRect();
        // Calcular offset en píxeles
        dragOffset.current = {
            x: e.clientX - (rect.left + (rect.width * pos.left / 100)),
            y: e.clientY - (rect.top + (rect.height * pos.top / 100))
        };
    }
  };

  const handleDrag = useCallback((e) => {
    if (!isDragging || !draggedObjectId || !parcelaRef.current) return;
    const rect = parcelaRef.current.getBoundingClientRect();
    
    const x = e.clientX - rect.left - dragOffset.current.x;
    const y = e.clientY - rect.top - dragOffset.current.y;

    // Convertir a %
    const left = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const top = Math.max(0, Math.min(100, (y / rect.height) * 100));
    
    setParcelaObjects(prev => prev.map(o => o.id === draggedObjectId ? { ...o, position: { top, left } } : o));
  }, [isDragging, draggedObjectId]);

  const handleDragEnd = useCallback(() => { setIsDragging(false); setDraggedObjectId(null); }, []);

  useEffect(() => {
    if (isDragging) { window.addEventListener('mousemove', handleDrag); window.addEventListener('mouseup', handleDragEnd); }
    else { window.removeEventListener('mousemove', handleDrag); window.removeEventListener('mouseup', handleDragEnd); }
    return () => { window.removeEventListener('mousemove', handleDrag); window.removeEventListener('mouseup', handleDragEnd); };
  }, [isDragging, handleDrag, handleDragEnd]);

  // --- HELPERS DE RENDER ---
  const getLumberjackImage = () => {
      if(animationState === 'idle') return images.lumberjack.idle;
      if(animationState === 'chopping') return images.lumberjack.chopping[lumberjackFrame];
      return images.lumberjack.sitting[lumberjackFrame];
  };

  const changeThemeColor = (color) => {
    const root = document.documentElement;
    let primary = color; 
    let bg = "#f9fafb";
    
    if (!color.startsWith("#")) {
        const colors = { indigo: "#4f46e5", pink: "#ec4899", teal: "#14b8a6", yellow: "#eab308" };
        const bgs = { indigo: "#e0e7ff", pink: "#fce7f3", teal: "#ccfbf1", yellow: "#fef9c3" };
        primary = colors[color];
        bg = bgs[color];
    } else {
        try { const rgb = hexToRgb(color); bg = `rgba(${rgb}, 0.2)`; } catch(e){}
    }
    root.style.setProperty("--theme-color-primary", primary);
    root.style.setProperty("--theme-color-bg", bg);
    if (!color.startsWith("#")) setConfigDropdownOpen(false);
  };
  
  const handleCustomColorChange = (e) => changeThemeColor(e.target.value);

  const getToastIcon = (type) => {
    switch (type) {
      case "success": return <ThumbsUp className="w-5 h-5 text-green-600" />;
      case "error": return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen relative">
      <style>{`
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        .pop-in { animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .parcela-object { transform: translate(-50%, -50%); cursor: grab; position: absolute; user-select: none; transition: transform 0.1s; }
        .parcela-object:active { cursor: grabbing; }
        .parcela-object:hover { z-index: 100; filter: brightness(1.1); }
        .parcela-object.dragging { opacity: 0.8; z-index: 50; transition: none; }
        :root { --theme-color-primary: #4f46e5; --theme-color-bg: #e0e7ff; }
        .house-size { width: 18rem; height: 18rem; }
        .standard-size { width: 6rem; height: 6rem; }
        .color-input-button { width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; cursor: pointer; overflow: hidden; }
        .color-input-button::-webkit-color-swatch-wrapper { padding: 0; }
        .color-input-button::-webkit-color-swatch { border: none; }
        .liquid-glass { background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); }
        .liquid-glass-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); }
      `}</style>

      {/* MODAL AGREGAR */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md liquid-glass-panel">
            <h3 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2"><Pencil /> Nueva Tarea</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input name="taskName" required className="w-full px-3 py-2 border rounded" placeholder="Nombre actividad" />
              <input name="taskReward" type="number" required min="1" className="w-full px-3 py-2 border rounded" placeholder="Recompensa" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddTaskModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded flex gap-1 items-center">Guardar <Sparkles size={16}/></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-30 w-full p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 rounded-xl shadow-lg liquid-glass relative px-4">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-extrabold text-indigo-800 tracking-wider">TYCOON TAREAS</h1>
                {/* EL BOTÓN QUE TE DABA ERROR AHORA FUNCIONARÁ */}
                <button onClick={toggleTycoonPanel} className="text-indigo-800 bg-indigo-100/50 px-3 py-1 rounded-full flex gap-1 items-center text-sm"><BarChart4 size={16}/> Datos</button>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={openStoreDrawer} className="text-indigo-800 font-medium flex gap-1 items-center">Tienda <ShoppingCart size={18}/></button>
                <button onClick={openActivitiesDrawer} className="text-indigo-800 font-medium flex gap-1 items-center">Actividades <ListTodo size={18}/></button>
                <span className="text-yellow-600 bg-yellow-100 border border-yellow-300 rounded-full font-bold py-1 px-3 flex gap-1 items-center">{coins} <DollarSign size={16}/></span>
                <button onClick={toggleConfig} className="text-indigo-800"><Settings size={20}/></button>
                <button onClick={handleResetData} className="text-red-400 hover:text-red-600" title="Resetear si hay error"><Trash2 size={18}/></button>
            </div>
            
            {/* Dropdown Config */}
            {configDropdownOpen && (
                <div className="absolute top-full right-4 mt-2 w-64 p-4 rounded-lg shadow-xl liquid-glass z-50">
                    <p className="font-bold mb-2 flex gap-1"><Palette size={16}/> Tema</p>
                    <div className="flex gap-2 mb-3">
                        {['indigo','pink','teal','yellow'].map(c => (
                            <button key={c} onClick={() => changeThemeColor(c)} className={`w-8 h-8 rounded-full bg-${c === 'indigo' ? 'indigo-600' : c === 'pink' ? 'pink-600' : c === 'teal' ? 'teal-600' : 'yellow-600'} border-2 border-white shadow`}/>
                        ))}
                    </div>
                    <p className="text-sm mb-1">Personalizado:</p>
                    <input type="color" onChange={handleCustomColorChange} className="color-input-button"/>
                </div>
            )}
        </div>
      </header>

      {/* SIDE DRAWERS */}
      <aside className={`fixed top-0 left-0 w-80 h-full liquid-glass shadow-2xl z-40 p-6 transition-transform ${storeDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex justify-between mb-6"><h3 className="text-2xl font-bold text-indigo-700 flex gap-2"><ShoppingCart /> Tienda</h3><button onClick={closeAll}><X /></button></div>
          <div className="space-y-4">
              {storeItems.map((item, i) => {
                  const Icon = ICON_MAP[item.objectId]; 
                  return (
                    <div key={i} className="flex justify-between items-center liquid-glass-panel p-3 rounded border">
                        <div>
                            <div className="flex items-center gap-2">{Icon && <Icon size={18} />} <span className="font-bold">{item.name}</span></div>
                            <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <button onClick={() => handleBuyItem(item)} className="bg-indigo-500 text-white text-xs px-2 py-1 rounded">Comprar ({item.cost})</button>
                    </div>
                  )
              })}
          </div>
      </aside>

      <aside className={`fixed top-0 right-0 w-80 h-full liquid-glass shadow-2xl z-40 p-6 transition-transform ${activitiesDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex justify-between mb-6"><h3 className="text-2xl font-bold text-indigo-700 flex gap-2"><ListTodo /> Actividades</h3><button onClick={closeAll}><X /></button></div>
          <button onClick={() => {setIsAddTaskModalOpen(true); closeAll()}} className="w-full mb-4 bg-purple-500 text-white py-2 rounded flex justify-center gap-2 font-bold"><Plus /> Nueva Tarea</button>
          <div className="space-y-4">
              {tasks.map(t => (
                  <div key={t.id} className={`p-3 rounded border ${t.completed ? 'bg-green-100' : t.inProgress ? 'bg-blue-100' : 'liquid-glass-panel'}`}>
                      <div className="flex justify-between mb-2">
                          <span className="font-bold">{t.name}</span>
                          <span className="text-indigo-600 text-sm">+{t.reward}</span>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => handleStartTask(t.id)} disabled={t.completed || t.inProgress} className="flex-1 bg-blue-500 text-white text-xs py-1 rounded disabled:bg-gray-400">Iniciar</button>
                          <button onClick={() => handleCompleteTask(t.id, t.reward)} disabled={!t.inProgress} className="flex-1 bg-green-500 text-white text-xs py-1 rounded disabled:bg-gray-400">Hecho</button>
                      </div>
                  </div>
              ))}
          </div>
      </aside>
      
      {/* TOAST */}
      <div className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${toast.visible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
          <div className="bg-white border-l-4 border-indigo-500 p-4 rounded shadow-xl flex gap-3 items-center">
              <span className="text-xl">{getToastIcon(toast.type)}</span>
              <p className="text-sm font-bold">{toast.message}</p>
          </div>
      </div>

      {/* Panel Tycoon */}
      {tycoonPanelOpen && (
        <div className="w-full z-20 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="p-8 rounded-xl shadow-lg border-t-4 border-green-500 liquid-glass">
              <h2 className="text-3xl font-extrabold text-gray-800 mb-4 flex items-center gap-2"><BarChart4 className="w-8 h-8 text-gray-800" /> Panel de la Parcela (Datos)</h2>
              <p className="text-gray-600 mb-6">Métricas y estadísticas clave de tu progreso.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg shadow-md liquid-glass-panel flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-yellow-600" />
                  <div><p className="text-sm font-medium text-yellow-800">Monedas</p><p className="text-3xl font-bold text-yellow-600">{coins}</p></div>
                </div>
                <div className="p-4 rounded-lg shadow-md liquid-glass-panel flex items-center gap-3">
                  <Home className="w-8 h-8 text-indigo-600" />
                  <div><p className="text-sm font-medium text-indigo-800">Objetos</p><p className="text-3xl font-bold text-indigo-600">{parcelaObjects.length}</p></div>
                </div>
                <div className="p-4 rounded-lg shadow-md liquid-glass-panel flex items-center gap-3">
                  <ListTodo className="w-8 h-8 text-green-600" />
                  <div><p className="text-sm font-medium text-green-800">Tareas Completadas</p><p className="text-3xl font-bold text-green-600">{tasks.filter((t) => t.completed).length}/{tasks.length}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN AREA */}
      <main className="w-full px-4 sm:px-6 lg:px-8 mt-6 mb-8">
        <div ref={parcelaRef} className="min-h-[calc(100vh-200px)] mx-auto rounded-xl shadow-2xl flex items-center justify-center relative liquid-glass p-0 max-w-[90%] overflow-hidden">
          <div className="w-full h-full min-h-[calc(100vh-200px)] relative" style={{ backgroundImage: `url(${images.parcela})`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none"></div>
            
            {/* Leñador */}
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-500 z-20 pointer-events-none">
              <div className="w-32 h-32 flex items-center justify-center">
                <img src={getLumberjackImage()} alt="Leñador" className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} />
              </div>
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1">
                {animationState === "idle" && <>💤 Esperando</>}
                {animationState === "chopping" && <><Zap className="w-3 h-3 text-white" /> ¡Trabajando!</>}
                {animationState === "sitting" && <><ListTodo className="w-3 h-3 text-white" /> Descansando</>}
              </div>
            </div>
            <div className="absolute bottom-16 left-[55%] text-8xl z-10 transform -translate-x-1/2 pointer-events-none">🌲</div>

            {/* OBJETOS PARCELA (DRAG & DROP) */}
            {parcelaObjects.map((obj) => {
              const Icon = ICON_MAP[obj.objectId];
              return (
              <div 
                key={obj.id} 
                className={`absolute pop-in parcela-object transition-all duration-200 z-15 ${isDragging && draggedObjectId === obj.id ? "dragging" : ""}`} 
                style={{ top: `${obj.position.top}%`, left: `${obj.position.left}%` }}
                onMouseDown={(e) => handleDragStart(e, obj.id, obj.position)}
              >
                <div className="relative group">
                  <img 
                    src={images.objects[obj.objectId]} 
                    alt={obj.name} 
                    className={`${obj.objectId === "casa" ? "house-size" : "standard-size"} object-contain drop-shadow-2xl`} 
                    style={{ imageRendering: "pixelated" }} 
                    draggable="false"
                  />
                  {/* Botón eliminar */}
                  {!(isDragging && draggedObjectId === obj.id) && (
                    <>
                        <div onClick={(e) => { e.stopPropagation(); removeParcelaObject(obj.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-md"><X className="w-4 h-4" /></div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition text-white bg-black/50 px-2 py-0.5 rounded text-[10px] pointer-events-none whitespace-nowrap flex items-center gap-1">
                            <MousePointer2 size={10}/> Mover
                        </div>
                        {/* Icono decorativo */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white/80 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition pointer-events-none">
                           {Icon && <Icon size={12} className="text-indigo-600"/>}
                        </div>
                    </>
                  )}
                </div>
              </div>
            )})}
          </div>
          
          {/* Paneles Laterales */}
          <div className="absolute top-4 left-4 text-sm text-gray-700 p-3 rounded-lg shadow-md liquid-glass-panel max-w-xs z-40">
            <p className="font-bold mb-1 flex items-center gap-1"><BarChart4 className="w-4 h-4" /> Estado:</p>
            <div className="text-xs space-y-1">
              <p className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-yellow-600" /> Monedas: <span className="font-bold text-yellow-600">{coins}</span></p>
              <p className="flex items-center gap-1"><Home className="w-3 h-3 text-indigo-600" /> Objetos: <span className="font-bold text-indigo-600">{parcelaObjects.length}</span></p>
            </div>
          </div>
          <div className="absolute top-4 right-4 text-sm text-gray-700 p-3 rounded-lg shadow-md liquid-glass-panel max-w-xs z-40">
            <p className="font-bold mb-1 flex items-center gap-1"><Home className="w-4 h-4" /> En Parcela:</p>
            {parcelaObjects.length === 0 ? <p className="text-gray-500 text-xs">Vacía</p> : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {parcelaObjects.map((obj, index) => {
                  const Icon = ICON_MAP[obj.objectId];
                  return <p key={index} className="text-xs flex items-center gap-1">{Icon && <Icon className="w-3 h-3" />} {obj.name}</p>;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="max-w-[90%] mx-auto mt-4 bg-white/80 backdrop-blur rounded-lg p-4 shadow-lg">
          <p className="text-sm text-gray-700">
            <strong><Info className="w-3 h-3 inline-block mr-1" /> Cómo jugar:</strong> 1) "Iniciar" tareas para trabajar. 2) "¡Hecho!" para cobrar. <strong className="text-indigo-600">3) Arrastra objetos para moverlos.</strong> 4) Hover sobre objeto y click en X para borrar.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;