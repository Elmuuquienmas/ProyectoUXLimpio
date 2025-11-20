// ./src/ui-demo.ts
// Lógica de UI, Drawers y Animaciones
let totalMonedas: number = 500;
let componentesComprados: number = 0;
let animationInterval: number | undefined;
let sittingAnimationInterval: number | undefined;
const currentTaskDuration: number = 3000;

interface ColorTheme {
    primary: string;
    bg: string;
}

const colorMap: Record<string, ColorTheme> = {
    indigo: { primary: '#4f46e5', bg: '#e0e7ff' },
    pink: { primary: '#ec4899', bg: '#fce7f3' },
    teal: { primary: '#0d9488', bg: '#ccfbf1' },
    yellow: { primary: '#eab308', bg: '#fef3c7' }
};

// =======================================================
// CORE UI FUNCTIONS (DRAWERS, DROPDOWNS, COINS)
// =======================================================

export function updateCoinDisplays(): void {
    totalMonedas = parseInt(localStorage.getItem('totalCoins') || '500');

    const displays = document.querySelectorAll('#total-coins-display, #main-coins-display, #header-coins-display');
    displays.forEach(el => {
        el.textContent = (el.id === 'header-coins-display' || el.id === 'total-coins-display') ? `${totalMonedas} 💰` : totalMonedas.toString();
    });
    
    const countDisplay = document.getElementById('components-count');
    if (countDisplay) {
        countDisplay.textContent = componentesComprados.toString();
    }
}

export function changeThemeColor(colorName: string): void {
    const root = document.documentElement;
    const colors = colorMap[colorName];
    if (colors) {
        root.style.setProperty('--theme-color-primary', colors.primary);
        root.style.setProperty('--theme-color-bg', colors.bg);
        console.log(`Tonalidad cambiada a: ${colorName}`);
    }
}

function closeTycoonPanel(): void {
    const panel = document.getElementById('tycoon-panel-dropdown');
    if (panel && panel.classList.contains('scale-y-100')) {
        panel.classList.remove('scale-y-100');
        panel.classList.add('scale-y-0');
        setTimeout(() => { 
            if (panel) panel.style.display = 'none'; 
        }, 300);
    }
}

function closeConfigDropdown(): void {
    const dropdown = document.getElementById('config-dropdown');
    if (dropdown && dropdown.classList.contains('scale-y-100')) {
        dropdown.classList.remove('scale-y-100');
        dropdown.classList.add('scale-y-0');
        setTimeout(() => { 
            if (dropdown) dropdown.style.display = 'none'; 
        }, 200);
    }
}

function closeAllDrawers(): void {
    const storeDrawer = document.getElementById('store-drawer');
    const activitiesDrawer = document.getElementById('activities-drawer');
    
    if (storeDrawer && storeDrawer.classList.contains('translate-x-0')) {
        storeDrawer.classList.remove('translate-x-0');
        storeDrawer.classList.add('-translate-x-full');
    }

    if (activitiesDrawer && activitiesDrawer.classList.contains('-translate-x-0')) {
        activitiesDrawer.classList.remove('-translate-x-0');
        activitiesDrawer.classList.add('translate-x-full');
    }
}

export function toggleDrawer(drawerId: string): void {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;

    let isVisible;
    if (drawerId === 'store-drawer') {
        isVisible = drawer.classList.contains('translate-x-0');
    } else if (drawerId === 'activities-drawer') {
        isVisible = drawer.classList.contains('-translate-x-0');
    }

    closeTycoonPanel();
    closeConfigDropdown();
    closeAllDrawers();

    if (!isVisible) {
        if (drawerId === 'store-drawer') {
            drawer.classList.remove('-translate-x-full');
            drawer.classList.add('translate-x-0');
        } else if (drawerId === 'activities-drawer') {
            drawer.classList.remove('translate-x-full');
            drawer.classList.add('-translate-x-0');
        }
    }
}

export function toggleTycoonPanel(): void {
    const panel = document.getElementById('tycoon-panel-dropdown');
    if (!panel) return;

    const isVisible = panel.classList.contains('scale-y-100');
    
    closeAllDrawers();
    closeConfigDropdown();

    if (isVisible) {
        closeTycoonPanel();
    } else {
        panel.style.display = 'block';
        setTimeout(() => {
            if (panel) {
                panel.classList.remove('scale-y-0');
                panel.classList.add('scale-y-100');
            }
        }, 10);
    }
}

export function toggleConfigDropdown(): void {
    const dropdown = document.getElementById('config-dropdown');
    if (!dropdown) return;

    const isVisible = dropdown.classList.contains('scale-y-100');

    closeAllDrawers(); 
    closeTycoonPanel();

    if (isVisible) {
        closeConfigDropdown();
    } else {
        dropdown.style.display = 'block';
        setTimeout(() => { 
            if (dropdown) {
                dropdown.classList.remove('scale-y-0');
                dropdown.classList.add('scale-y-100');
            }
        }, 10);
    }
}

// =======================================================
// LÓGICA DE ANIMACIÓN DEL LEÑADOR
// =======================================================

function startChoppingAnimation(): void {
    let frame: number = 0;
    const choppingFrames: string[] = [
        './assets/sprites/lumberjack_chop_up.png', 
        './assets/sprites/lumberjack_chop_down.png'
    ];
    
    const parcelText = document.getElementById('parcel-text'); 

    if (parcelText) parcelText.classList.add('hidden');
    
    const lumberjackSprite = document.getElementById('lumberjack-sprite') as HTMLImageElement | null;
    if (lumberjackSprite) {
        lumberjackSprite.classList.remove('bottom-0');
        lumberjackSprite.classList.add('bottom-0', 'left-1/4'); 
    }

    if (animationInterval) clearInterval(animationInterval);
    animationInterval = setInterval(() => {
        if (lumberjackSprite) {
            lumberjackSprite.src = choppingFrames[frame % choppingFrames.length];
        }
        frame++;
    }, 200);
}

function stopChoppingAnimation(): void {
    if (animationInterval) clearInterval(animationInterval);
    animationInterval = undefined;
}

function startSittingAnimation(): void {
    let frame: number = 0;
    const sittingFrames: string[] = [
        './assets/sprites/lumberjack_sit_idle.png', 
        './assets/sprites/lumberjack_sit_music.png'
    ];

    const lumberjackSprite = document.getElementById('lumberjack-sprite');
    if (lumberjackSprite) {
        lumberjackSprite.classList.remove('left-1/4'); 
        lumberjackSprite.classList.add('left-[35%]'); 
    }

    if (sittingAnimationInterval) clearInterval(sittingAnimationInterval);
    sittingAnimationInterval = setInterval(() => {
        if (lumberjackSprite instanceof HTMLImageElement) {
            lumberjackSprite.src = sittingFrames[frame % sittingFrames.length];
        }
        frame++;
    }, 500);
}

function stopSittingAnimation(): void {
    if (sittingAnimationInterval) clearInterval(sittingAnimationInterval);
    sittingAnimationInterval = undefined;

    const lumberjackSprite = document.getElementById('lumberjack-sprite') as HTMLImageElement | null;
    const parcelText = document.getElementById('parcel-text');

    if (lumberjackSprite) {
        lumberjackSprite.src = './assets/sprites/lumberjack_idle.png';
        lumberjackSprite.classList.remove('left-[35%]');
        lumberjackSprite.classList.add('bottom-0'); 
    }
    if (parcelText) parcelText.classList.remove('hidden');
}


// =======================================================
// INICIALIZACIÓN Y LISTENERS
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar monedas y sprites (Solo para la primera carga, React se encarga después)
    localStorage.setItem('totalCoins', totalMonedas.toString()); 
    updateCoinDisplays(); 
    
    const lumberjack = document.getElementById('lumberjack-sprite') as HTMLImageElement | null;
    const tree = document.getElementById('tree-sprite') as HTMLImageElement | null;
    const parcel = document.getElementById('parcel-text');

    if (lumberjack) lumberjack.src = './assets/sprites/lumberjack_idle.png';
    if (tree) tree.src = './assets/sprites/tree_stump.png';
    if (parcel) parcel.classList.remove('hidden');

    // --- ACTIVIDADES (Completar Tarea con Animación) ---
    document.getElementById('task-list')?.addEventListener('click', (event: Event) => {
        const targetElement = event.target instanceof HTMLElement ? event.target : null;
        const button = targetElement ? targetElement.closest('.complete-task') as HTMLButtonElement | null : null;

        if (button && !button.disabled) {
            const reward = parseInt(button.dataset.reward || '0');
            const taskDiv = button.closest('div');

            // 1. Deshabilitar botones y cerrar drawer
            document.querySelectorAll('.complete-task').forEach(btn => (btn as HTMLButtonElement).disabled = true);
            closeAllDrawers();
            closeTycoonPanel();
            closeConfigDropdown();

            // 2. Iniciar animación de "golpeando"
            startChoppingAnimation();

            // 3. Simular el tiempo de la tarea (3 segundos de corte)
            setTimeout(() => {
                stopChoppingAnimation(); 

                // 4. Sumar recompensa y actualizar UI
                let currentCoins: number = parseInt(localStorage.getItem('totalCoins') || '500');
                currentCoins += reward;
                localStorage.setItem('totalCoins', currentCoins.toString());
                updateCoinDisplays(); 
                
                // 5. Marcar tarea como completada visualmente
                if (taskDiv) {
                    taskDiv.classList.remove('liquid-glass-panel');
                    taskDiv.classList.add('bg-green-100', 'border-green-400', 'opacity-50');
                }
                button.textContent = 'Completado ✓';
                button.classList.remove('bg-green-500', 'hover:bg-green-600');
                button.classList.add('bg-gray-400');

                // 6. Iniciar animación de "descanso"
                startSittingAnimation();

                // 7. Tiempo de "descanso" (2 segundos)
                setTimeout(() => {
                    stopSittingAnimation(); 
                    document.querySelectorAll('.complete-task').forEach(btn => (btn as HTMLButtonElement).disabled = false);
                    alert(`¡Tarea completada! Ganaste ${reward} monedas. Saldo total: ${currentCoins}`);
                }, 2000);

            }, currentTaskDuration); 
        }
    });

    // --- TIENDA (Comprar Componente) ---
    document.getElementById('store-items')?.addEventListener('click', (event: Event) => {
        const targetElement = event.target instanceof HTMLElement ? event.target : null;
        const button = targetElement ? targetElement.closest('.buy-item') as HTMLButtonElement | null : null;
        
        if (button && !button.disabled) {
            const cost = parseInt(button.dataset.cost || '0');
            const item = button.dataset.item;
            let currentCoins: number = parseInt(localStorage.getItem('totalCoins') || '500');

            if (currentCoins >= cost) {
                currentCoins -= cost;
                localStorage.setItem('totalCoins', currentCoins.toString());
                componentesComprados += 1;
                updateCoinDisplays();
                
                const displayList = document.getElementById('purchased-items-display');
                if (displayList) {
                    displayList.innerHTML += `<p class="mt-1">✅ ${item} <span class="text-xs text-green-600">(-${cost} 💰)</span></p>`;
                }

                button.textContent = 'Comprado';
                button.disabled = true;
                button.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
                button.classList.add('bg-gray-400');

                alert(`¡${item} comprado por ${cost} monedas!`);

            } else {
                alert(`¡Monedas insuficientes! Necesitas ${cost} monedas para comprar ${item}.`);
            }
        }
    });

    // --- MANEJO DE CLICKS GENERALES (Color Picker, Tycoon Panel, Configuración) ---
    document.addEventListener('click', (event: Event) => {
        const targetElement = event.target instanceof HTMLElement ? event.target : null;
        
        const picker = targetElement ? targetElement.closest('.color-picker') as HTMLButtonElement | null : null;
        const configBtn = targetElement ? targetElement.closest('#toggle-config-btn') : null;
        const tycoonBtn = targetElement ? targetElement.closest('#toggle-tycoon-panel-btn') : null;
        
        const dropdown = document.getElementById('config-dropdown');
        const tycoonPanel = document.getElementById('tycoon-panel-dropdown');

        if (picker) {
            const color = picker.dataset.color;
            if (color) changeThemeColor(color);
            toggleConfigDropdown(); 
        } 
        
        // Cierre de configuración
        if (dropdown && !configBtn && !dropdown.contains(targetElement as Node) && dropdown.classList.contains('scale-y-100')) {
            closeConfigDropdown();
        }
        // Cierre del panel Tycoon
        if (tycoonPanel && !tycoonBtn && !tycoonPanel.contains(targetElement as Node) && tycoonPanel.classList.contains('scale-y-100')) {
            closeTycoonPanel();
        }
    });

    // Cierre de todos los componentes con tecla ESC
    document.addEventListener('keydown', function(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeAllDrawers();
            closeConfigDropdown();
            closeTycoonPanel();
        }
    });
});