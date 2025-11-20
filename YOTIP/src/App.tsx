import React, { useState, useEffect, useCallback, useRef } from "react";

// NUEVA FUNCIÓN: Convierte un código de color HEX a formato RGB (e.g., "#4f46e5" a "79, 70, 229")
// Esto es necesario para aplicar transparencia con RGBA al color de fondo.
function hexToRgb(hex) {
    // Elimina el # si existe
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
    
    // Si el formato es corto (e.g., #03F), lo expande (e.g., #0033FF)
    const expandedHex = cleanHex.length === 3
        ? cleanHex.split('').map(char => char + char).join('')
        : cleanHex;

    const bigint = parseInt(expandedHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}


function App() {
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('totalCoins');
    return saved ? parseInt(saved) : 5000;
  });
  const [storeDrawerOpen, setStoreDrawerOpen] = useState(false);
  const [activitiesDrawerOpen, setActivitiesDrawerOpen] = useState(false);
  const [configDropdownOpen, setConfigDropdownOpen] = useState(false);
  const [tycoonPanelOpen, setTycoonPanelOpen] = useState(false);
  const [parcelaObjects, setParcelaObjects] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationState, setAnimationState] = useState('idle');
  const [lumberjackFrame, setLumberjackFrame] = useState(0);
  const [tasks, setTasks] = useState([
    { id: 1, name: "Leer 1 artículo (Simple)", reward: 10, completed: false, inProgress: false },
    { id: 2, name: "Organizar la bandeja de entrada", reward: 25, completed: false, inProgress: false },
    { id: 3, name: "Ejercicio de 30 minutos", reward: 50, completed: false, inProgress: false },
  ]);
  const [activeTaskId, setActiveTaskId] = useState(null);

  // --- ESTADOS Y MANEJADORES DE POPUP/TOAST ---
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'success' });
  
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000); 
  }, []);

  const handleAddTask = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.taskName.value.trim();
    const reward = parseInt(form.taskReward.value);

    if (!name || isNaN(reward) || reward <= 0) {
        showToast('Debes ingresar un nombre y una recompensa válida (> 0).', 'error');
        return;
    }

    const newTask = {
        id: Date.now(),
        name: name,
        reward: reward,
        completed: false,
        inProgress: false
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    setIsAddTaskModalOpen(false);
    showToast(`Tarea "${name}" agregada con +${reward} monedas.`, 'info');
  };
  // ---------------------------------------------


  // Configuración de imágenes
  const images = {
    parcela: '/src/assets/parcela.png',
    lumberjack: {
      idle: '/src/assets/base.png',
      chopping: [
        '/src/assets/trabajando.png',
        '/src/assets/trabajando2.png'
      ],
      sitting: [
        '/src/assets/descanso.png',
        '/src/assets/descanso2.png'
      ]
    },
    objects: {
      perro: '/src/assets/perro.png',
      gato: '/src/assets/gato.png',
      casa: '/src/assets/casa.png'
    }
  };

  const storeItems = [
    { name: "Perro", description: "Un fiel compañero para tu parcela.", cost: 150, type: "object", objectId: "perro", emoji: "🐕" },
    { name: "Gato", description: "Un adorable gatito pixel art.", cost: 100, type: "object", objectId: "gato", emoji: "🐱" },
    { name: "Casa", description: "Una hermosa casa de madera.", cost: 500, type: "object", objectId: "casa", emoji: "🏠" },
  ];

  // Sincronizar coins con localStorage
  useEffect(() => {
    localStorage.setItem('totalCoins', coins.toString());
  }, [coins]);

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
        setIsAddTaskModalOpen(false); // Cerrar también el modal de tareas
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
        emoji: item.emoji,
        cost: item.cost,
        position: {
          top: Math.random() * 50 + 25,
          left: Math.random() * 60 + 20
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

  // Lógica de color MODIFICADA
  const changeThemeColor = (color) => {
    let primaryColor, bgColor;
    
    if (color.startsWith('#')) {
        // Maneja el color hexadecimal
        primaryColor = color;
        
        // CORRECCIÓN: Fondo con transparencia basada en el color primario
        try {
            const rgb = hexToRgb(color);
            bgColor = `rgba(${rgb}, 0.2)`; // 20% de opacidad del color primario
        } catch (e) {
            console.error("Error al convertir HEX a RGB:", e);
            bgColor = '#f9fafb'; // Fallback
        }
        
    } else {
        // Maneja los colores predefinidos
        const colors = {
            indigo: { primary: '#4f46e5', bg: '#e0e7ff' },
            pink: { primary: '#ec4899', bg: '#fce7f3' },
            teal: { primary: '#14b8a6', bg: '#ccfbf1' },
            yellow: { primary: '#eab308', bg: '#fef9c3' },
        };
        primaryColor = colors[color].primary;
        bgColor = colors[color].bg;
    }

    const root = document.documentElement;
    root.style.setProperty('--theme-color-primary', primaryColor);
    root.style.setProperty('--theme-color-bg', bgColor);
    
    // Solo cerramos el dropdown si NO es una selección del color picker que sigue abierto.
    if (!color.startsWith('#')) {
        setConfigDropdownOpen(false);
    }
    showToast(`Tema cambiado a ${color.startsWith('#') ? 'Color Personalizado' : color.charAt(0).toUpperCase() + color.slice(1)}`, 'info');
  };
  
  // Manejar el cambio del color personalizado
  const handleCustomColorChange = (event) => {
      const hexColor = event.target.value;
      changeThemeColor(hexColor);
  };

  const getLumberjackImage = () => {
    if (animationState === 'idle') {
      return images.lumberjack.idle;
    } else if (animationState === 'chopping') {
      return images.lumberjack.chopping[lumberjackFrame];
    } else if (animationState === 'sitting') {
      return images.lumberjack.sitting[lumberjackFrame];
    }
    return images.lumberjack.idle;
  };

  return (
    <div className="min-h-screen relative">
      <style>{`
        /* --- Animaciones CSS --- */
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

        .parcela-object:hover {
          transform: scale(1.15);
          filter: brightness(1.2);
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
        
        /* Estilos para el Input de Color visible */
        .color-input-button {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            border: 3px solid white; /* Border para contraste */
            border-radius: 50%;
            width: 40px; 
            height: 40px;
            cursor: pointer;
            padding: 0;
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        /* Hace que el color picker nativo ocupe todo el espacio del input */
        .color-input-button::-webkit-color-swatch-wrapper {
            padding: 0;
        }

        .color-input-button::-webkit-color-swatch {
            border: none;
        }

        .color-input-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2);
        }

      `}</style>

      {/* MODAL DE AGREGAR TAREA */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all liquid-glass-panel">
            <h3 className="text-2xl font-bold text-indigo-700 mb-4">✍️ Agregar Nueva Tarea</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Actividad</label>
                <input 
                  type="text" 
                  id="taskName" 
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: Terminar proyecto de React"
                />
              </div>
              <div>
                <label htmlFor="taskReward" className="block text-sm font-medium text-gray-700 mb-1">Recompensa (Monedas 💰)</label>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                >
                  Agregar Tarea ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* TOAST DE NOTIFICACIÓN */}
      <div 
        className={`fixed bottom-4 left-4 z-50 transition-all duration-300 transform w-72 ${toast.visible ? 'translate-x-0' : '-translate-x-[30rem]'}`}
      >
        <div className={`p-4 rounded-xl shadow-2xl flex items-center space-x-3 liquid-glass-panel 
          ${toast.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 
            toast.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' : 
            'bg-blue-50 border-l-4 border-blue-500'}`}
        >
          <span className="text-xl">
            {toast.type === 'success' ? '🎉' : toast.type === 'error' ? '❌' : '💡'}
          </span>
          <p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
        </div>
      </div>


      {/* Drawer de Tienda */}
      <aside className={`fixed top-0 left-0 w-80 h-full liquid-glass transform transition-transform duration-300 ease-in-out shadow-2xl z-40 p-6 overflow-y-auto ${storeDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-indigo-700">🛒 Tienda</h3>
          <button onClick={() => setStoreDrawerOpen(false)} className="text-gray-500 hover:text-red-500 text-lg">✕</button>
        </div>

        <div className="p-4 rounded-lg bg-yellow-100 mb-6 border-l-4 border-yellow-500 liquid-glass-panel">
          <p className="font-bold text-lg text-yellow-800">Tu Saldo:</p>
          <p className="text-3xl font-extrabold text-yellow-600">{coins} 💰</p>
        </div>
        
        <div className="space-y-4">
          {storeItems.map((item, index) => {
            return (
              <div key={index} className="flex justify-between items-center liquid-glass-panel p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {item.emoji && <span className="text-xl">{item.emoji}</span>}
                    <p className="font-semibold text-gray-800">{item.name}</p>
                  </div>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-yellow-600 text-sm">{item.cost} 💰</span>
                  <button 
                    onClick={() => handleBuyItem(item)} 
                    disabled={isAnimating}
                    className={`text-white text-xs py-1 px-3 rounded transition ${isAnimating ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Drawer de Actividades */}
      <aside className={`fixed top-0 right-0 w-80 h-full liquid-glass transform transition-transform duration-300 ease-in-out shadow-2xl z-40 p-6 overflow-y-auto ${activitiesDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-indigo-700">📋 Actividades Diarias</h3>
          <button onClick={() => setActivitiesDrawerOpen(false)} className="text-gray-500 hover:text-red-500 text-lg">✕</button>
        </div>
        
        <button 
            onClick={() => { setIsAddTaskModalOpen(true); closeAll(); }}
            className="w-full mb-6 py-2 px-4 bg-purple-500 text-white font-bold rounded-lg shadow-md hover:bg-purple-600 transition"
        >
            + Agregar Tarea Personalizada
        </button>

        <p className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">Completa para ganar recompensas:</p>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className={`p-3 rounded-lg border ${task.completed ? 'bg-green-100 border-green-400 opacity-50' : task.inProgress ? 'bg-blue-100 border-blue-400' : 'liquid-glass-panel'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{task.name}</p>
                  <p className="text-sm text-indigo-600">+{task.reward} Monedas</p>
                </div>
                {task.inProgress && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-bold">
                    ⚙️ En Progreso
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleStartTask(task.id)} 
                  disabled={task.completed || task.inProgress || isAnimating}
                  className={`flex-1 text-white text-sm py-2 px-3 rounded transition ${task.completed || task.inProgress || isAnimating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  {task.inProgress ? 'En Curso ⚙️' : 'Iniciar 🚀'}
                </button>
                <button 
                  onClick={() => handleCompleteTask(task.id, task.reward)} 
                  disabled={!task.inProgress || task.completed || isAnimating}
                  className={`flex-1 text-white text-sm py-2 px-3 rounded transition ${!task.inProgress || task.completed || isAnimating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {task.completed ? 'Completado ✓' : '¡Hecho! ✓'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-30 w-full p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 rounded-xl shadow-lg liquid-glass relative">
          
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-extrabold text-indigo-800 tracking-wider ml-4">
              TYCOON TAREAS
            </h1>
            
            <button 
              onClick={toggleTycoonPanel}
              className="text-sm font-medium text-indigo-800 hover:text-indigo-600 bg-indigo-100/50 px-3 py-1 rounded-full transition"
            >
              Panel de Datos 📊
            </button>
          </div>

          <nav className="flex space-x-4 mr-4">
            <button onClick={openStoreDrawer} className="text-indigo-800 hover:text-indigo-600 font-medium py-2 px-3 transition duration-150">
              Tienda 🛒
            </button>
            <button onClick={openActivitiesDrawer} className="text-indigo-800 hover:text-indigo-600 font-medium py-2 px-3 transition duration-150">
              Actividades 📋
            </button>
            
            <button className="text-yellow-600 bg-yellow-100 border border-yellow-300 rounded-full font-bold py-1 px-3 transition duration-150">
              {coins} 💰
            </button>
            
            <button 
              onClick={toggleConfig}
              className="text-indigo-800 hover:text-indigo-600 font-medium py-2 px-3 transition duration-150"
            >
              Configuración ⚙️
            </button>
          </nav>
          
          {/* Dropdown de Configuración */}
          {configDropdownOpen && (
            <div className="absolute top-full right-4 mt-2 w-64 p-4 rounded-lg shadow-xl liquid-glass z-50">
              <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">🎨 Paleta de Diseño</h4>
              <div className="flex flex-wrap gap-3">
                
                {/* Botones de Colores Predefinidos */}
                <button 
                    onClick={() => changeThemeColor('indigo')} 
                    className="w-8 h-8 rounded-full bg-indigo-600 shadow-md border-2 border-white focus:outline-none focus:ring-4 focus:ring-indigo-600/50"
                    title="Índigo (Por Defecto)"
                ></button>
                <button 
                    onClick={() => changeThemeColor('pink')} 
                    className="w-8 h-8 rounded-full bg-pink-600 shadow-md border-2 border-white focus:outline-none focus:ring-4 focus:ring-pink-600/50"
                    title="Rosa"
                ></button>
                <button 
                    onClick={() => changeThemeColor('teal')} 
                    className="w-8 h-8 rounded-full bg-teal-600 shadow-md border-2 border-white focus:outline-none focus:ring-4 focus:ring-teal-600/50"
                    title="Verde Azulado"
                ></button>
                <button 
                    onClick={() => changeThemeColor('yellow')} 
                    className="w-8 h-8 rounded-full bg-yellow-600 shadow-md border-2 border-white focus:outline-none focus:ring-4 focus:ring-yellow-600/50"
                    title="Amarillo"
                ></button>
              </div>
              
              <div className="mt-3 pt-2 border-t border-gray-200">
                 <p className="text-sm font-medium text-gray-700 mb-2">Color Personalizado:</p>
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

      {/* Panel de Datos (Tycoon Panel) */}
      {tycoonPanelOpen && (
        <div className="w-full z-20 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="p-8 rounded-xl shadow-lg border-t-4 border-green-500 liquid-glass">
              <h2 className="text-3xl font-extrabold text-gray-800 mb-4">📊 Panel de la Parcela (Datos)</h2>
              <p className="text-gray-600 mb-6">Métricas y estadísticas clave de tu progreso.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg shadow-md liquid-glass-panel">
                  <p className="text-sm font-medium text-yellow-800">Monedas</p>
                  <p className="text-3xl font-bold text-yellow-600">{coins}</p>
                </div>
                <div className="p-4 rounded-lg shadow-md liquid-glass-panel">
                  <p className="text-sm font-medium text-indigo-800">Objetos en Parcela</p>
                  <p className="text-3xl font-bold text-indigo-600">{parcelaObjects.length}</p>
                </div>
                <div className="p-4 rounded-lg shadow-md liquid-glass-panel">
                  <p className="text-sm font-medium text-green-800">Tareas Completadas</p>
                  <p className="text-3xl font-bold text-green-600">{tasks.filter(t => t.completed).length}/{tasks.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Área de la Parcela */}
      <main className="w-full px-4 sm:px-6 lg:px-8 mt-6 mb-8">
        {/* MODIFICADO: Altura ampliada */}
        <div className="min-h-[calc(100vh-200px)] mx-auto rounded-xl shadow-2xl flex items-center justify-center relative liquid-glass p-0 max-w-[90%] overflow-hidden">
          
          {/* Imagen de fondo de la parcela */}
          <div 
            className="w-full h-full min-h-[calc(100vh-200px)] relative"
            style={{
              backgroundImage: `url(${images.parcela})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
            
            {/* Leñador con animación de sprites - CENTRADO */}
            <div className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-500 z-20`}>
              <div className="w-32 h-32 flex items-center justify-center">
                <img 
                  src={getLumberjackImage()} 
                  alt="Leñador"
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                {animationState === 'idle' && '😴 Esperando'}
                {animationState === 'chopping' && '🪓 ¡Trabajando!'}
                {animationState === 'sitting' && '🎵 Descansando'}
              </div>
            </div>
            
            {/* Árbol/Tocón */}
            <div className="absolute bottom-16 left-[55%] text-8xl z-10 transform -translate-x-1/2">
              🌲
            </div>

            {/* Objetos de la parcela (perro, gato, casa) */}
            {parcelaObjects.map((obj) => (
              <div
                key={obj.id}
                className="absolute pop-in cursor-pointer parcela-object transition-all duration-200 z-15"
                style={{
                  top: `${obj.position.top}%`,
                  left: `${obj.position.left}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => removeParcelaObject(obj.id)}
              >
                <div className="relative float">
                  {/* MODIFICADO: Casa más grande usando clase custom */}
                  <img 
                    src={images.objects[obj.objectId]} 
                    alt={obj.name}
                    className={`${obj.objectId === 'casa' ? 'house-size' : 'w-24 h-24'} object-contain drop-shadow-2xl`}
                    style={{ imageRendering: 'pixelated' }}
                  />
                  
                  <div className="absolute inset-0 bg-red-500/0 hover:bg-red-500/80 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                    <span className="text-white font-bold text-xl">✕</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Mensaje de bienvenida */}
            {animationState === 'idle' && parcelaObjects.length === 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-30">
                <div className="bg-black/60 text-white px-8 py-6 rounded-2xl backdrop-blur-sm">
                  <p className="text-2xl font-bold mb-2">🌲 Tu Parcela Vacía 🌲</p>
                  <p className="text-sm">¡Compra objetos en la tienda para decorar!</p>
                </div>
              </div>
            )}
          </div>

          {/* Items Comprados (Panel lateral) */}
          <div className="absolute top-4 left-4 text-sm text-gray-700 p-3 rounded-lg shadow-md liquid-glass-panel max-w-xs z-40">
            <p className="font-bold mb-1">📊 Estado:</p>
            <div className="text-xs space-y-1">
              <p>💰 Monedas: <span className="font-bold text-yellow-600">{coins}</span></p>
              <p>🏡 Objetos: <span className="font-bold text-indigo-600">{parcelaObjects.length}</span></p>
              <p>✅ Tareas: <span className="font-bold text-green-600">{tasks.filter(t => t.completed).length}/{tasks.length}</span></p>
              {tasks.some(t => t.inProgress) && (
                <p className="text-blue-600 font-bold mt-2">⚙️ Tarea en curso</p>
              )}
            </div>
          </div>

          {/* Objetos en parcela (Panel lateral derecho) */}
          <div className="absolute top-4 right-4 text-sm text-gray-700 p-3 rounded-lg shadow-md liquid-glass-panel max-w-xs z-40">
            <p className="font-bold mb-1">🏡 En Parcela:</p>
            {parcelaObjects.length === 0 ? (
              <p className="text-gray-500 text-xs">Vacía</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {parcelaObjects.map((obj, index) => (
                  <p key={index} className="text-xs">
                    {obj.emoji} {obj.name}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="max-w-[90%] mx-auto mt-4 bg-white/80 backdrop-blur rounded-lg p-4 shadow-lg">
          <p className="text-sm text-gray-700">
            <strong>💡 Cómo jugar:</strong> 1) Click en "Iniciar 🚀" para comenzar una tarea (el leñador trabaja). 2) Cuando termines, click en "¡Hecho! ✓" para recibir monedas (el leñador descansa). 3) Compra objetos en la tienda para decorar tu parcela. 4) Click en objetos para eliminarlos.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;