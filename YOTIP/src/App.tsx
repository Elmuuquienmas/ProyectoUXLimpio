import React, { useState, useEffect, useCallback } from "react";
// Importaciones de Lucide se mantienen
import {
  ShoppingCart,
  ListTodo,
  Settings,
  DollarSign,
  BarChart4,
  X,
  Plus,
  Check,
  Zap, // Para 'En Progreso' o 'Iniciar'
  Heart, // Perro
  Cat, // Gato
  Home, // Casa
  Palette, // Configuración de Paleta
  Sparkles, // Agregar Tarea
  Pencil, // Agregar Nueva Tarea (Modal)
  AlertTriangle, // Error Toast
  Info, // Info Toast
  ThumbsUp, // Success Toast
  MousePointer2, // Icono para arrastrar
} from "lucide-react";

// NUEVA FUNCIÓN: Convierte un código de color HEX a formato RGB (e.g., "#4f46e5" a "79, 70, 229")
function hexToRgb(hex) {
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
  const expandedHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex;
  const bigint = parseInt(expandedHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

// ----------------------------------------------------
// 1. ESTADO INICIAL MODIFICADO (Carga Objetos de LocalStorage)
// ----------------------------------------------------
function getInitialParcelaObjects() {
  const saved = localStorage.getItem("parcelaObjects");
  return saved ? JSON.parse(saved) : [];
}
// ----------------------------------------------------


function App() {
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem("totalCoins");
    return saved ? parseInt(saved) : 5000;
  });
  const [storeDrawerOpen, setStoreDrawerOpen] = useState(false);
  const [activitiesDrawerOpen, setActivitiesDrawerOpen] = useState(false);
  const [configDropdownOpen, setConfigDropdownOpen] = useState(false);
  const [tycoonPanelOpen, setTycoonPanelOpen] = useState(false);
  
  // AHORA CARGA LOS OBJETOS DESDE localStorage
  const [parcelaObjects, setParcelaObjects] = useState(getInitialParcelaObjects); 

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationState, setAnimationState] = useState("idle");
  const [lumberjackFrame, setLumberjackFrame] = useState(0);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      name: "Leer 1 artículo (Simple)",
      reward: 10,
      completed: false,
      inProgress: false,
    },
    {
      id: 2,
      name: "Organizar la bandeja de entrada",
      reward: 25,
      completed: false,
      inProgress: false,
    },
    {
      id: 3,
      name: "Ejercicio de 30 minutos",
      reward: 50,
      completed: false,
      inProgress: false,
    },
  ]);
  const [activeTaskId, setActiveTaskId] = useState(null);

  // --- ESTADO DE ARRASTRE ---
  const [isDragging, setIsDragging] = useState(false);
  const [draggedObjectId, setDraggedObjectId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const parcelaRef = React.useRef(null);
  // -------------------------

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    visible: false,
    type: "success",
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, visible: true, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  }, []);

  // ... (handleAddTask, images, storeItems se mantienen igual) ...

  const handleAddTask = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.taskName.value.trim();
    const reward = parseInt(form.taskReward.value);

    if (!name || isNaN(reward) || reward <= 0) {
      showToast("Debes ingresar un nombre y una recompensa válida (> 0).", "error");
      return;
    }

    const newTask = {
      id: Date.now(),
      name: name,
      reward: reward,
      completed: false,
      inProgress: false,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    setIsAddTaskModalOpen(false);
    showToast(`Tarea "${name}" agregada con +${reward} monedas.`, "info");
  };

  const images = {
    parcela: "/src/assets/parcela.png",
    lumberjack: {
      idle: "/src/assets/base.png",
      chopping: ["/src/assets/trabajando.png", "/src/assets/trabajando2.png"],
      sitting: ["/src/assets/descanso.png", "/src/assets/descanso2.png"],
    },
    objects: {
      perro: "/src/assets/perro.png",
      gato: "/src/assets/gato.png",
      casa: "/src/assets/casa.png",
    },
  };

  const storeItems = [
    {
      name: "Perro",
      description: "Un fiel compañero para tu parcela.",
      cost: 150,
      type: "object",
      objectId: "perro",
      lucideIcon: Heart, 
    },
    {
      name: "Gato",
      description: "Un adorable gatito pixel art.",
      cost: 100,
      type: "object",
      objectId: "gato",
      lucideIcon: Cat, 
    },
    {
      name: "Casa",
      description: "Una hermosa casa de madera.",
      cost: 500,
      type: "object",
      objectId: "casa",
      lucideIcon: Home,
    },
  ];

  // ----------------------------------------------------
  // 2. useEffects para Sincronizar con localStorage
  // ----------------------------------------------------
  useEffect(() => {
    localStorage.setItem("totalCoins", coins.toString());
  }, [coins]);
  
  // NUEVO: Sincronizar objetos de parcela con localStorage
  useEffect(() => {
    localStorage.setItem("parcelaObjects", JSON.stringify(parcelaObjects));
  }, [parcelaObjects]);
  // ----------------------------------------------------

  // ... (useEffect para animaciones, useEffect para control de estado de animación, useEffect para cerrar con ESC se mantienen) ...

  // Animaciones del leñador (cambio de frames)
  useEffect(() => {
    let interval;
    
    if (animationState === 'chopping') {
      interval = setInterval(() => {
        setLumberjackFrame(prev => (prev + 1) % 2);
      }, 300);
    } else if (animationState === 'sitting') {
      interval = setInterval(() => {
        setLumberjackFrame(prev => (prev + 1) % 2);
      }, 500);
    } else {
      setLumberjackFrame(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [animationState]);

  // Control del estado de la animación basado en activeTaskId y tareas en progreso.
  useEffect(() => {
    const hasAnyTaskInProgress = tasks.some(t => t.inProgress);
    
    if (activeTaskId === null && !hasAnyTaskInProgress && animationState === 'chopping') {
      setIsAnimating(true);
      setAnimationState('sitting');
      
      const timeout = setTimeout(() => {
        setAnimationState('idle');
        setIsAnimating(false);
      }, 2000);

      return () => clearTimeout(timeout);
    } 
    else if (hasAnyTaskInProgress && animationState !== 'chopping') {
      setAnimationState('chopping');
    }

  }, [activeTaskId, tasks, animationState]);
  
  // Cerrar todo con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeAll();
        setIsAddTaskModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);


  const closeAll = () => {
    setStoreDrawerOpen(false);
    setActivitiesDrawerOpen(false);
    setConfigDropdownOpen(false);
    setTycoonPanelOpen(false);
  };

  const openStoreDrawer = () => {
    closeAll();
    setStoreDrawerOpen(true);
  };

  const openActivitiesDrawer = () => {
    closeAll();
    setActivitiesDrawerOpen(true);
  };

  const toggleConfig = () => {
    setStoreDrawerOpen(false);
    setActivitiesDrawerOpen(false);
    setTycoonPanelOpen(false);
    setConfigDropdownOpen(!configDropdownOpen);
  };

  const toggleTycoonPanel = () => {
    setStoreDrawerOpen(false);
    setActivitiesDrawerOpen(false);
    setConfigDropdownOpen(false);
    setTycoonPanelOpen(!tycoonPanelOpen);
  };

  const handleBuyItem = (item) => {
    if (isAnimating) return;
    
    if (coins >= item.cost) {
      setCoins(coins - item.cost);
      
      const newObject = {
        id: Date.now() + Math.random(),
        name: item.name,
        objectId: item.objectId,
        lucideIcon: item.lucideIcon,
        cost: item.cost,
        // Posición inicial aleatoria, pero ahora con formato [top, left] en porcentaje
        position: {
          top: Math.random() * 60 + 10,
          left: Math.random() * 70 + 15
        }
      };
      setParcelaObjects([...parcelaObjects, newObject]);
      showToast(`¡${item.name} agregado a tu parcela por ${item.cost} monedas!`, 'success');
    } else {
      showToast(`¡Monedas insuficientes! Necesitas ${item.cost} monedas para comprar ${item.name}.`, 'error');
    }
  };

  const removeParcelaObject = (objectId) => {
    setParcelaObjects(parcelaObjects.filter(obj => obj.id !== objectId));
    showToast('Objeto removido de la parcela.', 'info');
  };
  
  // ... (handleStartTask, handleCompleteTask, changeThemeColor, handleCustomColorChange, getLumberjackImage, getToastIcon se mantienen) ...

  const handleStartTask = (taskId) => {
    if (isAnimating) return;
    
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, inProgress: true } : { ...task, inProgress: false }
    );
    setTasks(updatedTasks);
    setActiveTaskId(taskId);
    setAnimationState('chopping');
    closeAll();
    showToast(`Comenzando tarea: ${tasks.find(t => t.id === taskId).name}`, 'info');
  };

  const handleCompleteTask = (taskId, reward) => {
    if (isAnimating) return;

    setIsAnimating(true); 

    const taskName = tasks.find(t => t.id === taskId)?.name || "Tarea";
    
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: true, inProgress: false } : task
    );
    setTasks(updatedTasks);
    
    setCoins(prevCoins => {
      const newCoins = prevCoins + reward;
      showToast(`✅ Tarea completada: ${taskName}! Ganaste ${reward} monedas.`, 'success');
      return newCoins;
    });

    setActiveTaskId(null);

    setTimeout(() => {
      setIsAnimating(false);
    }, 500); 
  };

  const changeThemeColor = (color) => {
    let primaryColor, bgColor;

    if (color.startsWith("#")) {
      primaryColor = color;
      try {
        const rgb = hexToRgb(color);
        bgColor = `rgba(${rgb}, 0.2)`; 
      } catch (e) {
        console.error("Error al convertir HEX a RGB:", e);
        bgColor = "#f9fafb"; 
      }
    } else {
      const colors = {
        indigo: { primary: "#4f46e5", bg: "#e0e7ff" },
        pink: { primary: "#ec4899", bg: "#fce7f3" },
        teal: { primary: "#14b8a6", bg: "#ccfbf1" },
        yellow: { primary: "#eab308", bg: "#fef9c3" },
      };
      primaryColor = colors[color].primary;
      bgColor = colors[color].bg;
    }

    const root = document.documentElement;
    root.style.setProperty("--theme-color-primary", primaryColor);
    root.style.setProperty("--theme-color-bg", bgColor);

    if (!color.startsWith("#")) {
      setConfigDropdownOpen(false);
    }
    showToast(
      `Tema cambiado a ${
        color.startsWith("#")
          ? "Color Personalizado"
          : color.charAt(0).toUpperCase() + color.slice(1)
      }`,
      "info"
    );
  };

  const handleCustomColorChange = (event) => {
    const hexColor = event.target.value;
    changeThemeColor(hexColor);
  };

  const getLumberjackImage = () => {
    if (animationState === "idle") {
      return images.lumberjack.idle;
    } else if (animationState === "chopping") {
      return images.lumberjack.chopping[lumberjackFrame];
    } else if (animationState === "sitting") {
      return images.lumberjack.sitting[lumberjackFrame];
    }
    return images.lumberjack.idle;
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "success":
        return <ThumbsUp className="w-5 h-5 text-green-600" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };


  // ----------------------------------------------------
  // 3. LÓGICA DE ARRASTRE (DRAG & DROP)
  // ----------------------------------------------------

  const updateParcelaObjectPosition = (id, newPosition) => {
    setParcelaObjects(prevObjects => 
        prevObjects.map(obj => 
            obj.id === id ? { ...obj, position: newPosition } : obj
        )
    );
  };

  const handleDragStart = (e, id, objPosition) => {
    // Evita el comportamiento de arrastre predeterminado del navegador
    e.preventDefault(); 
    
    // Solo permitir el arrastre si no estamos en una animación principal
    if (isAnimating) return;

    setIsDragging(true);
    setDraggedObjectId(id);

    // Captura las coordenadas del contenedor de la parcela
    const parcelaRect = parcelaRef.current.getBoundingClientRect();
    
    // El objeto se posiciona con 'top' y 'left' en porcentaje, pero los eventos de mouse son en píxeles.
    // Calculamos el desfase (offset) entre el click del mouse y el centro del objeto (50% del ancho del objeto)
    // Coordenada x del centro del objeto en PÍXELES:
    // (parcelaRect.width * objPosition.left / 100) + parcelaRect.left

    // Distancia del mouse al centro del objeto (en píxeles)
    const offsetX = e.clientX - (parcelaRect.left + (parcelaRect.width * objPosition.left / 100));
    const offsetY = e.clientY - (parcelaRect.top + (parcelaRect.height * objPosition.top / 100));

    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleDrag = useCallback((e) => {
    if (!isDragging || !draggedObjectId || !parcelaRef.current) return;

    // Obtener las dimensiones y posición del contenedor
    const parcelaRect = parcelaRef.current.getBoundingClientRect();
    
    // Calcular la nueva posición del centro del objeto en PÍXELES
    // Restamos el offset para que el punto de arrastre (donde se hizo click) se mantenga en el cursor.
    const newXInPixels = e.clientX - parcelaRect.left - dragOffset.x;
    const newYInPixels = e.clientY - parcelaRect.top - dragOffset.y;
    
    // Convertir las nuevas coordenadas a PORCENTAJE (para que sea responsivo)
    let newLeft = (newXInPixels / parcelaRect.width) * 100;
    let newTop = (newYInPixels / parcelaRect.height) * 100;

    // Limitar la posición para que no se salga de la parcela (0% a 100%)
    newLeft = Math.min(Math.max(0, newLeft), 100);
    newTop = Math.min(Math.max(0, newTop), 100);

    // Actualizar la posición en el estado
    updateParcelaObjectPosition(draggedObjectId, { top: newTop, left: newLeft });
  }, [isDragging, draggedObjectId, dragOffset]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
        setIsDragging(false);
        setDraggedObjectId(null);
        // showToast('Posición guardada.', 'info'); // Opcional: Notificar que se guardó
    }
  }, [isDragging]);

  // Se agregan los listeners globales para mover y soltar fuera del objeto
  useEffect(() => {
    if (isDragging) {
        window.addEventListener('mousemove', handleDrag);
        window.addEventListener('mouseup', handleDragEnd);
    } else {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
    }

    // Limpieza de eventos
    return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);


  // ----------------------------------------------------


  return (
    <div className="min-h-screen relative">
      <style>{`
        /* --- Estilos y animaciones (se mantienen) --- */
        @keyframes popIn {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .pop-in { animation: popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .float { animation: float 3s ease-in-out infinite; }

        /* ESTILO PARA EL ARRASTRE */
        .parcela-object {
            /* Asegura que la transformación 50/50 esté siempre al centro de las coordenadas (top, left) */
            transform: translate(-50%, -50%); 
            cursor: grab;
            transition: filter 0.2s, transform 0.2s; /* Se quita la transición del float */
        }
        .parcela-object:hover:not(.dragging) {
          transform: translate(-50%, -50%) scale(1.15); /* Ajuste para el nuevo transform */
          filter: brightness(1.2);
        }
        .parcela-object.dragging {
            cursor: grabbing;
            z-index: 50; /* Lo pone por encima de todo lo demás */
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            filter: drop-shadow(0 0 10px var(--theme-color-primary));
        }


        /* Variables de Tema por Defecto */
        :root {
            --theme-color-primary: #4f46e5;
            --theme-color-bg: #e0e7ff;
        }

        /* Estilo para la casa MUCHO más grande */
        .house-size {
          width: 36rem; /* w-[36rem] */
          height: 36rem; /* h-[36rem] */
        }
        
        /* ... (Estilos de color-input-button se mantienen) ... */

      `}</style>

      {/* MODAL DE AGREGAR TAREA (Se mantiene igual) */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all liquid-glass-panel">
            <h3 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
              <Pencil className="w-6 h-6 text-indigo-700" /> Agregar Nueva Tarea
            </h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label
                  htmlFor="taskName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre de la Actividad
                </label>
                <input
                  type="text"
                  id="taskName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: Terminar proyecto de React"
                />
              </div>
              <div>
                <label
                  htmlFor="taskReward"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Recompensa (Monedas)
                </label>
                <input
                  type="number"
                  id="taskReward"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: 150"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition flex items-center gap-1"
                >
                  Agregar Tarea <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST DE NOTIFICACIÓN (Se mantiene igual) */}
      <div
        className={`fixed bottom-4 left-4 z-50 transition-all duration-300 transform w-72 ${
          toast.visible ? "translate-x-0" : "-translate-x-[30rem]"
        }`}
      >
        <div
          className={`p-4 rounded-xl shadow-2xl flex items-center space-x-3 liquid-glass-panel 
          ${
            toast.type === "success"
              ? "bg-green-50 border-l-4 border-green-500"
              : toast.type === "error"
              ? "bg-red-50 border-l-4 border-red-500"
              : "bg-blue-50 border-l-4 border-blue-500"
          }`}
        >
          <span className="text-xl">{getToastIcon(toast.type)}</span>
          <p className="text-sm font-medium text-gray-800 flex-1">
            {toast.message}
          </p>
        </div>
      </div>

      {/* Drawer de Tienda (Se mantiene igual) */}
      <aside
        className={`fixed top-0 left-0 w-80 h-full liquid-glass transform transition-transform duration-300 ease-in-out shadow-2xl z-40 p-6 overflow-y-auto ${
          storeDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" /> Tienda
          </h3>
          <button
            onClick={() => setStoreDrawerOpen(false)}
            className="text-gray-500 hover:text-red-500 text-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 rounded-lg bg-yellow-100 mb-6 border-l-4 border-yellow-500 liquid-glass-panel">
          <p className="font-bold text-lg text-yellow-800">Tu Saldo:</p>
          <p className="text-3xl font-extrabold text-yellow-600 flex items-center gap-1">
            {coins} <DollarSign className="w-6 h-6" />
          </p>
        </div>

        <div className="space-y-4">
          {storeItems.map((item, index) => {
            const LucideIcon = item.lucideIcon;
            return (
              <div
                key={index}
                className="flex justify-between items-center liquid-glass-panel p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {LucideIcon && <LucideIcon className="w-5 h-5" />}
                    <p className="font-semibold text-gray-800">{item.name}</p>
                  </div>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-yellow-600 text-sm">
                    {item.cost} <DollarSign className="w-4 h-4 inline-block" />
                  </span>
                  <button
                    onClick={() => handleBuyItem(item)}
                    disabled={isAnimating}
                    className={`text-white text-xs py-1 px-3 rounded transition ${
                      isAnimating
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-500 hover:bg-indigo-600"
                    }`}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Drawer de Actividades (Se mantiene igual) */}
      <aside
        className={`fixed top-0 right-0 w-80 h-full liquid-glass transform transition-transform duration-300 ease-in-out shadow-2xl z-40 p-6 overflow-y-auto ${
          activitiesDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
            <ListTodo className="w-6 h-6" /> Actividades Diarias
          </h3>
          <button
            onClick={() => setActivitiesDrawerOpen(false)}
            className="text-gray-500 hover:text-red-500 text-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={() => {
            setIsAddTaskModalOpen(true);
            closeAll();
          }}
          className="w-full mb-6 py-2 px-4 bg-purple-500 text-white font-bold rounded-lg shadow-md hover:bg-purple-600 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Agregar Tarea Personalizada
        </button>

        <p className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">
          Completa para ganar recompensas:
        </p>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border ${
                task.completed
                  ? "bg-green-100 border-green-400 opacity-50"
                  : task.inProgress
                  ? "bg-blue-100 border-blue-400"
                  : "liquid-glass-panel"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{task.name}</p>
                  <p className="text-sm text-indigo-600 flex items-center gap-1">
                    +<DollarSign className="w-4 h-4 inline-block" />
                    {task.reward} Monedas
                  </p>
                </div>
                {task.inProgress && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> En Progreso
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStartTask(task.id)}
                  disabled={task.completed || task.inProgress || isAnimating}
                  className={`flex-1 text-white text-sm py-2 px-3 rounded transition flex items-center justify-center gap-1 ${
                    task.completed || task.inProgress || isAnimating
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {task.inProgress ? (
                    <>
                      En Curso <Zap className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Iniciar <Zap className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCompleteTask(task.id, task.reward)}
                  disabled={!task.inProgress || task.completed || isAnimating}
                  className={`flex-1 text-white text-sm py-2 px-3 rounded transition flex items-center justify-center gap-1 ${
                    !task.inProgress || task.completed || isAnimating
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {task.completed ? (
                    <>
                      Completado <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      ¡Hecho! <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Header (Se mantiene igual) */}
      <header className="sticky top-0 z-30 w-full p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 rounded-xl shadow-lg liquid-glass relative">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-extrabold text-indigo-800 tracking-wider ml-4">
              TYCOON TAREAS
            </h1>

            <button
              onClick={toggleTycoonPanel}
              className="text-sm font-medium text-indigo-800 hover:text-indigo-600 bg-indigo-100/50 px-3 py-1 rounded-full transition flex items-center gap-1"
            >
              Panel de Datos <BarChart4 className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex space-x-4 mr-4">
            <button
              onClick={openStoreDrawer}
              className="text-indigo-800 hover:text-indigo-600 font-medium py-2 px-3 transition duration-150 flex items-center gap-1"
            >
              Tienda <ShoppingCart className="w-5 h-5" />
            </button>
            <button
              onClick={openActivitiesDrawer}
              className="text-indigo-800 hover:text-indigo-600 font-medium py-2 px-3 transition duration-150 flex items-center gap-1"
            >
              Actividades <ListTodo className="w-5 h-5" />
            </button>

            <button className="text-yellow-600 bg-yellow-100 border border-yellow-300 rounded-full font-bold py-1 px-3 transition duration-150 flex items-center gap-1">
              {coins} <DollarSign className="w-5 h-5" />
            </button>

            <button
              onClick={toggleConfig}
              className="text-indigo-800 hover:text-indigo-600 font-medium py-2 px-3 transition duration-150 flex items-center gap-1"
            >
              Configuración <Settings className="w-5 h-5" />
            </button>
          </nav>

          {/* Dropdown de Configuración (Se mantiene igual) */}
          {configDropdownOpen && (
            <div className="absolute top-full right-4 mt-2 w-64 p-4 rounded-lg shadow-xl liquid-glass z-50">
              <h4 className="font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-1">
                <Palette className="w-4 h-4" /> Paleta de Diseño
              </h4>
              <div className="flex flex-wrap gap-3">
                {/* Botones de Colores Predefinidos */}
                <button
                  onClick={() => changeThemeColor("indigo")}
                  className="w-8 h-8 rounded-full bg-indigo-600 shadow-md border-2 border-white focus:outline-none focus:ring-4 focus:ring-indigo-600/50"
                  title="Índigo (Por Defecto)"
                ></button>
                <button
                  onClick={() => changeThemeColor("pink")}
                  className="w-8 h-8 rounded-full bg-pink-600 shadow-md border-2 border-white focus:outline-none focus:ring-4 focus:ring-pink-600/50"
                  title="Rosa"
                ></button>
                <button
                  onClick={() => changeThemeColor("teal")}
                  className="w-8 h-8 rounded-full bg-teal-600 shadow-md border-2 border-white focus:outline-none focus:ring-4 focus:ring-teal-600/50"
                  title="Verde Azulado"
                ></button>
                <button
                  onClick={() => changeThemeColor("yellow")}
                  className="w-8 h-8 rounded-full bg-yellow-600 shadow-md border-2 border-white focus:outline-none focus:ring-4 focus:ring-yellow-600/50"
                  title="Amarillo"
                ></button>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Color Personalizado:
                </p>
                {/* Selector de Color Visible (Input Type Color) */}
                <input
                  type="color"
                  onChange={handleCustomColorChange}
                  className="color-input-button"
                  title="Seleccionar cualquier color"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Panel de Datos (Tycoon Panel) (Se mantiene igual) */}
      {tycoonPanelOpen && (
        <div className="w-full z-20 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="p-8 rounded-xl shadow-lg border-t-4 border-green-500 liquid-glass">
              <h2 className="text-3xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart4 className="w-8 h-8 text-gray-800" /> Panel de la
                Parcela (Datos)
              </h2>
              <p className="text-gray-600 mb-6">
                Métricas y estadísticas clave de tu progreso.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg shadow-md liquid-glass-panel flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Monedas
                    </p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {coins}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg shadow-md liquid-glass-panel flex items-center gap-3">
                  <Home className="w-8 h-8 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-indigo-800">
                      Objetos en Parcela
                    </p>
                    <p className="text-3xl font-bold text-indigo-600">
                      {parcelaObjects.length}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg shadow-md liquid-glass-panel flex items-center gap-3">
                  <ListTodo className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Tareas Completadas
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {tasks.filter((t) => t.completed).length}/{tasks.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Área de la Parcela */}
      <main className="w-full px-4 sm:px-6 lg:px-8 mt-6 mb-8">
        {/* Referencia (ref) agregada al contenedor de la parcela para calcular posiciones */}
        <div 
          ref={parcelaRef}
          className="min-h-[calc(100vh-200px)] mx-auto rounded-xl shadow-2xl flex items-center justify-center relative liquid-glass p-0 max-w-[90%] overflow-hidden"
        >
          {/* Imagen de fondo de la parcela */}
          <div
            className="w-full h-full min-h-[calc(100vh-200px)] relative"
            style={{
              backgroundImage: `url(${images.parcela})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>

            {/* Leñador con animación de sprites (Se mantiene igual) */}
            <div
              className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-500 z-20`}
            >
              <div className="w-32 h-32 flex items-center justify-center">
                <img
                  src={getLumberjackImage()}
                  alt="Leñador"
                  className="w-full h-full object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1">
                {animationState === "idle" && (
                  <>
                    💤 Esperando
                  </>
                )}
                {animationState === "chopping" && (
                  <>
                    <Zap className="w-3 h-3 text-white" /> ¡Trabajando!
                  </>
                )}
                {animationState === "sitting" && (
                  <>
                    <ListTodo className="w-3 h-3 text-white" /> Descansando
                  </>
                )}
              </div>
            </div>

            {/* Árbol/Tocón */}
            <div className="absolute bottom-16 left-[55%] text-8xl z-10 transform -translate-x-1/2">
              🌲
            </div>

            {/* Objetos de la parcela (perro, gato, casa) - MODIFICADO para arrastre */}
            {parcelaObjects.map((obj) => (
              <div
                key={obj.id}
                className={`absolute pop-in parcela-object transition-all duration-200 z-15 ${
                    isDragging && draggedObjectId === obj.id ? 'dragging' : ''
                }`}
                style={{
                  top: `${obj.position.top}%`,
                  left: `${obj.position.left}%`,
                  // Ya no se necesita el transform: 'translate(-50%, -50%)' aquí si está en CSS.
                }}
                // Evento para INICIAR el arrastre
                onMouseDown={(e) => handleDragStart(e, obj.id, obj.position)}
                // Previene el menú contextual del navegador
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="relative">
                  <img
                    src={images.objects[obj.objectId]}
                    alt={obj.name}
                    className={`${
                      obj.objectId === "casa" ? "house-size" : "w-24 h-24"
                    } object-contain drop-shadow-2xl`}
                    style={{ imageRendering: "pixelated" }}
                    draggable="false" // Evita el arrastre nativo del navegador en la imagen
                  />

                  {/* Panel de remoción: solo aparece si NO estamos arrastrando este objeto */}
                  {!(isDragging && draggedObjectId === obj.id) && (
                    <div 
                        className="absolute inset-0 bg-red-500/0 hover:bg-red-500/80 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation(); // Evita iniciar el drag si se hace click en la X
                            removeParcelaObject(obj.id);
                        }}
                        title={`Click para eliminar ${obj.name}`}
                    >
                        <X className="w-6 h-6 text-white font-bold" />
                    </div>
                  )}

                  {/* Indicador de arrastre */}
                  {!(isDragging && draggedObjectId === obj.id) && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-900/70 text-white px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition duration-150 flex items-center gap-1">
                      <MousePointer2 className="w-3 h-3 text-white" /> Arrastrar
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Mensaje de bienvenida (Se mantiene igual) */}
            {animationState === "idle" && parcelaObjects.length === 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-30">
                <div className="bg-black/60 text-white px-8 py-6 rounded-2xl backdrop-blur-sm">
                  <p className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                    <Home className="w-6 h-6 text-white" /> Tu Parcela Vacía
                  </p>
                  <p className="text-sm">
                    ¡Compra objetos en la tienda para decorar!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Items Comprados (Panel lateral) (Se mantiene igual) */}
          <div className="absolute top-4 left-4 text-sm text-gray-700 p-3 rounded-lg shadow-md liquid-glass-panel max-w-xs z-40">
            <p className="font-bold mb-1 flex items-center gap-1">
              <BarChart4 className="w-4 h-4" /> Estado:
            </p>
            <div className="text-xs space-y-1">
              <p className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-yellow-600" /> Monedas:{" "}
                <span className="font-bold text-yellow-600">{coins}</span>
              </p>
              <p className="flex items-center gap-1">
                <Home className="w-3 h-3 text-indigo-600" /> Objetos:{" "}
                <span className="font-bold text-indigo-600">
                  {parcelaObjects.length}
                </span>
              </p>
              <p className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-600" /> Tareas:{" "}
                <span className="font-bold text-green-600">
                  {tasks.filter((t) => t.completed).length}/{tasks.length}
                </span>
              </p>
              {tasks.some((t) => t.inProgress) && (
                <p className="text-blue-600 font-bold mt-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Tarea en curso
                </p>
              )}
            </div>
          </div>

          {/* Objetos en parcela (Panel lateral derecho) (Se mantiene igual) */}
          <div className="absolute top-4 right-4 text-sm text-gray-700 p-3 rounded-lg shadow-md liquid-glass-panel max-w-xs z-40">
            <p className="font-bold mb-1 flex items-center gap-1">
              <Home className="w-4 h-4" /> En Parcela:
            </p>
            {parcelaObjects.length === 0 ? (
              <p className="text-gray-500 text-xs">Vacía</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {parcelaObjects.map((obj, index) => {
                  const LucideIcon = obj.lucideIcon;
                  return (
                    <p key={index} className="text-xs flex items-center gap-1">
                      {LucideIcon && <LucideIcon className="w-3 h-3" />}
                      {obj.name}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones - ACTUALIZADAS */}
        <div className="max-w-[90%] mx-auto mt-4 bg-white/80 backdrop-blur rounded-lg p-4 shadow-lg">
          <p className="text-sm text-gray-700">
            <strong>
              <Info className="w-3 h-3 inline-block mr-1" /> Cómo jugar:
            </strong>{" "}
            1) Click en "Iniciar 🚀" para comenzar una tarea. 2) Cuando termines, click en "¡Hecho! ✓" para recibir monedas.{" "}
            <strong className="text-indigo-600">
                3) ¡Arrastra los objetos de la parcela para reorganizarlos! (La posición se guarda automáticamente).
            </strong>
            4) Haz clic en la 'X' roja que aparece al pasar el mouse para eliminarlos.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;