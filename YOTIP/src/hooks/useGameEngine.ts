import { useState, useEffect, useRef } from 'react';
// Ruta para salir de 'hooks' y buscar en 'src'
import { getUserData, saveUserData } from './supabaseUtils'; 
import type { Task, ParcelaObject, StoreItem } from '../types';

const DEFAULT_TASKS: Task[] = [
  { id: 1, name: "Leer 1 artículo", reward: 10, completed: false, inProgress: false, deadline: null, archived: false },
  { id: 2, name: "Organizar correo", reward: 25, completed: false, inProgress: false, deadline: null, archived: false },
  { id: 3, name: "Ejercicio 30 min", reward: 50, completed: false, inProgress: false, deadline: null, archived: false },
];

export function useGameEngine(currentUser: string | null) {
  const [coins, setCoins] = useState<number>(0);
  const [parcelaObjects, setParcelaObjects] = useState<ParcelaObject[]>([]);
  const objectsRef = useRef<ParcelaObject[]>(parcelaObjects);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('indigo');
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  useEffect(() => { objectsRef.current = parcelaObjects; }, [parcelaObjects]);

  // 1. LIMPIEZA
  useEffect(() => {
    setCoins(0);
    setParcelaObjects([]);
    setTasks([]);
    setUsername(null);
    setIsDataLoaded(false);
  }, [currentUser]);

  // 2. CARGA DE DATOS
  useEffect(() => {
    let mounted = true;
    if (!currentUser) return;

    async function load() {
      try {
        const data = await getUserData(currentUser!);
        if (!mounted) return;

        if (data) {
          setCoins(data.coins ?? 0);
          setParcelaObjects(data.objects || []);
          const dbTasks = data.tasks; 
          setTasks((dbTasks && dbTasks.length > 0) ? dbTasks : DEFAULT_TASKS);
          setUsername(data.username || null);
          setTheme(data.theme || 'indigo');
          if (!data.username) setShowUsernameModal(true);
          
          setIsDataLoaded(true); 
        } else {
          // USUARIO NUEVO
          setTasks(DEFAULT_TASKS);
          setCoins(0);
          setParcelaObjects([]);
          setShowUsernameModal(true);
          setIsDataLoaded(true); 

          saveUserData(currentUser!, { 
            coins: 0, 
            objects: [], 
            tasks: DEFAULT_TASKS 
          }).catch(err => console.error("Error guardando fondo:", err));
        }
      } catch (e) {
        console.error("Error cargando:", e);
        setIsDataLoaded(true); 
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentUser]);

  // 3. GUARDADO INTELIGENTE
  const smartSave = async (data: any) => {
    if (!currentUser || !isDataLoaded) return;
    setIsSaving(true);
    try { await saveUserData(currentUser, data); }
    catch (e) { console.error(e); }
    finally { setTimeout(() => setIsSaving(false), 500); }
  };

  // --- ACCIONES ---

  const buyItem = (item: StoreItem) => {
    if (coins < item.cost) return false;
    const newCoins = coins - item.cost;
    const newObj: ParcelaObject = { 
        id: Date.now() + Math.random(), name: item.name, objectId: item.objectId || '', 
        cost: item.cost, position: { top: 50, left: 50 } 
    };
    const newObjects = [...parcelaObjects, newObj];
    setCoins(newCoins);
    setParcelaObjects(newObjects);
    smartSave({ coins: newCoins, objects: newObjects });
    return true;
  };

  const updateObjectsVisual = (newObjects: ParcelaObject[]) => setParcelaObjects(newObjects);

  const completeTask = (taskId: number, reward: number, proofImage: string) => {
     const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: true, inProgress: false, proofImage } : t);
     const newCoins = coins + reward;
     setTasks(newTasks);
     setCoins(newCoins);
     smartSave({ tasks: newTasks, coins: newCoins });
  };

  const saveNewTask = (task: Task) => {
    const newTasks = [...tasks, task];
    setTasks(newTasks);
    smartSave({ tasks: newTasks });
  };

  const updateTaskStatus = (taskId: number, inProgress: boolean) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, inProgress } : t);
    setTasks(newTasks);
    smartSave({ tasks: newTasks });
  };

  // --- FUNCIÓN NUEVA: CAMBIAR TAREA ACTIVA (SWAP) ---
  const switchActiveTask = (newTaskId: number) => {
    const newTasks = tasks.map(t => {
      // 1. Si es la nueva tarea -> La encendemos
      if (t.id === newTaskId) return { ...t, inProgress: true, archived: false };
      // 2. Si es cualquier otra tarea que estaba activa -> La apagamos
      if (t.inProgress) return { ...t, inProgress: false };
      // 3. El resto sigue igual
      return t;
    });
    
    setTasks(newTasks);
    smartSave({ tasks: newTasks });
  };
  
  const resetTasks = () => {
      const newTasks = tasks.map(t => ({...t, archived: true, inProgress: false}));
      setTasks(newTasks);
      smartSave({ tasks: newTasks });
  };

  const saveTheme = (newTheme: string) => { setTheme(newTheme); smartSave({ theme: newTheme }); };

  const saveUsername = (name: string) => { setUsername(name); setShowUsernameModal(false); smartSave({ username: name }); };

  return {
    coins, parcelaObjects, tasks, username, theme,
    isDataLoaded, isSaving, showUsernameModal, setShowUsernameModal,
    saveUsername, saveTheme, buyItem, 
    setParcelaObjects, objectsRef, smartSave, updateObjectsVisual,
    completeTask, saveNewTask, updateTaskStatus, switchActiveTask, // <--- ¡AQUÍ ESTÁ!
    resetTasks
  };
}