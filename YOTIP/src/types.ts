export interface Task {
  id: number;
  name: string;
  reward: number;
  completed: boolean;
  inProgress: boolean;
  deadline: string | null;
  proofImage?: string | null;
  archived?: boolean;
}

export interface ParcelaObject {
  id: string | number;
  name: string;
  objectId: string;
  lucideIcon?: any;
  cost?: number;
  position: { top: number; left: number };
}

export interface StoreItem {
  name: string;
  description: string;
  cost: number;
  type: string;
  objectId?: string;
  lucideIcon?: any;
}

export interface UserData {
  coins?: number;
  objects?: ParcelaObject[];
  tasks?: Task[];
  theme?: string;
  username?: string;
  displayName?: string;
  createdAt?: string | number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast { message: string; visible: boolean; type: ToastType }

export interface ViewTransform { x: number; y: number; scale: number }
