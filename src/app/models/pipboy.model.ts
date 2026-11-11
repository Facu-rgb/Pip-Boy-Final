export type PipboyTab = 'STAT' | 'INV' | 'DATA' | 'MAP' | 'RADIO';
export type ItemCategory = 'WEAPONS' | 'APPAREL' | 'AID' | 'MISC';

export interface StatValue { label: string; value: number; max: number; tone?: 'green' | 'amber' | 'red'; }
export interface InventoryItem { id: string; name: string; category: ItemCategory; quantity: number; weight: number; condition: number; icon: string; description: string; effect?: string; }
export interface QuestLogEntry { id: string; title: string; location: string; distance: string; active: boolean; }
export interface RadioStation { id: string; name: string; frequency: string; signal: number; description: string; playing: boolean; }
