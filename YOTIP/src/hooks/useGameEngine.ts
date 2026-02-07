import { useState, useEffect, useRef } from 'react';
import { getUserData, saveUserData } from './supabaseUtils';
import type { Task, ParcelaObject, StoreItem } from '../types';

const DEFAULT_TASKS: Task[] = [
  { id: 1, name: "Leer 1 artículo", reward: 10, completed: false, inProgress: false, deadline: null, archived: false },
  { id: 2, name: "Organizar correo", reward: 25, completed: false, inProgress: false, deadline: null, archived: false },
  { id: 3, name: "Ejercicio 30 min", reward: 50, completed: false, inProgress: false, deadline: null, archived: false },
];

const POSSIBLE_TASKS = [
  { name: "Tomar un vaso de agua", reward: 5 }, { name: "Estirar 5 minutos", reward: 10 }, { name: "Limpiar el escritorio", reward: 20 },
  { name: "Leer 10 páginas", reward: 30 }, { name: "Meditar 5 minutos", reward: 15 }, { name: "Responder 3 emails", reward: 25 },
  { name: "Hacer la cama", reward: 15 }, { name: "Caminar 10 minutos", reward: 20 }, { name: "Dibujar algo rápido", reward: 10 }
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
    setCoins(0); setParcelaObjects([]); setTasks([]); setUsername(null); setIsDataLoaded(false);
  }, [currentUser]);

  // 2. CARGA DE DATOS (CON RECUPERACIÓN DE RESPALDO)
  useEffect(() => {
    let mounted = true;
    if (!currentUser) return;

    async function load() {
      try {
        // A) Primero buscamos si hay un "Respaldo de Emergencia" local pendiente
        const localBackup = localStorage.getItem(`unsaved_${currentUser}`);
        let finalData: any = null;

        if (localBackup) {
          finalData = JSON.parse(localBackup);
        } else {
          // B) Si no hay respaldo, bajamos de la nube
          finalData = await getUserData(currentUser!);
        }

        if (!mounted) return;

        if (finalData) {
          // --- CARGAMOS DATOS ---
          setCoins(finalData.coins ?? 0);
          setParcelaObjects(finalData.objects || []);
          const dbTasks = finalData.tasks;
          setTasks((dbTasks && dbTasks.length > 0) ? dbTasks : DEFAULT_TASKS);
          setUsername(finalData.username || null);
          setTheme(finalData.theme || 'indigo');
          if (!finalData.username) setShowUsernameModal(true);

          setIsDataLoaded(true);

          // Si usamos el backup local, intentamos subirlo a la nube ahora mismo
          if (localBackup) {
            smartSave(finalData);
          }

        } else {
          // --- USUARIO NUEVO ---
          setTasks(DEFAULT_TASKS); setCoins(0); setParcelaObjects([]); setShowUsernameModal(true); setIsDataLoaded(true);
          saveUserData(currentUser!, { coins: 0, objects: [], tasks: DEFAULT_TASKS }).catch(console.error);
        }
      } catch (e) {
        console.error("Error cargando:", e);
        setIsDataLoaded(true);
      }
    }
    load();
    return () => { mounted = false; };
  }, [currentUser]);

  // 3. GUARDADO BLINDADO (LA TÉCNICA QUE PEDISTE) 🛡️
  const smartSave = async (partialData: any) => {
    if (!currentUser || !isDataLoaded) return;
    setIsSaving(true);

    // 1. Preparamos el PAQUETE COMPLETO
    const fullData = {
      coins: partialData.coins !== undefined ? partialData.coins : coins,
      objects: partialData.objects !== undefined ? partialData.objects : parcelaObjects,
      tasks: partialData.tasks !== undefined ? partialData.tasks : tasks,
      ...(partialData.username && { username: partialData.username }),
      ...(partialData.theme && { theme: partialData.theme }),
    };

    try {
      // 2. GUARDA LOCALMENTE PRIMERO (Seguro de vida)
      localStorage.setItem(`unsaved_${currentUser}`, JSON.stringify(fullData));

      // 3. INTENTA SUBIR A LA NUBE
      await saveUserData(currentUser, fullData);

      // 4. ÉXITO: BORRA EL RESPALDO LOCAL (Como pediste)
      // 4. ÉXITO: BORRA EL RESPALDO LOCAL (Como pediste)
      localStorage.removeItem(`unsaved_${currentUser}`);

    } catch (e) {
      // No borramos el localStorage, así la próxima vez que entre, se recupera.
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
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
    const newCoins = Math.min(coins + reward, 1000); // SECURITY: Cap at 1000 coins
    setTasks(newTasks);
    setCoins(newCoins);
    smartSave({ tasks: newTasks, coins: newCoins });
  };

  const saveNewTask = (task: Task) => {
    // SECURITY: Cooldown check
    const activeTasksCount = tasks.filter(t => !t.archived && !t.completed).length;

    // Check if cooldown is active
    const cooldownEndTime = localStorage.getItem(`task_cooldown_${currentUser}`);
    if (cooldownEndTime && Date.now() < parseInt(cooldownEndTime)) {
      const remainingMinutes = Math.ceil((parseInt(cooldownEndTime) - Date.now()) / 60000);
      throw new Error(`¡Límite alcanzado! Espera ${remainingMinutes} min para crear más tareas.`);
    }

    // Apply limit: If already >= 5, set cooldown for NEXT time, but ALLOW this one.
    if (activeTasksCount >= 5) {
      const cooldown = Date.now() + 5 * 60 * 1000; // 5 minutes
      localStorage.setItem(`task_cooldown_${currentUser}`, cooldown.toString());
      // We do NOT throw here. We proceed to create.
    }

    const newTasks = [...tasks, task];
    setTasks(newTasks);
    smartSave({ tasks: newTasks });
  };

  const editTask = (updatedTask: Task) => {
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTasks);
    smartSave({ tasks: newTasks });
  };

  const rerollTask = (taskId: number) => {
    const randomTemplate = POSSIBLE_TASKS[Math.floor(Math.random() * POSSIBLE_TASKS.length)];
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, name: randomTemplate.name, reward: randomTemplate.reward } : t);
    setTasks(newTasks);
    smartSave({ tasks: newTasks });
    return randomTemplate.name;
  };

  const switchActiveTask = (newTaskId: number) => {
    const newTasks = tasks.map(t => {
      if (t.id === newTaskId) return { ...t, inProgress: true, archived: false };
      if (t.inProgress) return { ...t, inProgress: false };
      return t;
    });
    setTasks(newTasks);
    smartSave({ tasks: newTasks });
  };

  const updateTaskStatus = (taskId: number, inProgress: boolean) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, inProgress } : t);
    setTasks(newTasks);
    smartSave({ tasks: newTasks });
  };

  const resetTasks = () => {
    const newTasks = tasks.map(t => ({ ...t, archived: true, inProgress: false }));
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
    completeTask, saveNewTask, editTask, rerollTask, switchActiveTask, updateTaskStatus, resetTasks
  };
}