import { Injectable } from '@angular/core';
import type { InventoryItem, ItemCategory, QuestLogEntry, RadioStation, StatValue } from '../models/pipboy.model';

@Injectable({ providedIn: 'root' })
export class PipboyService {
  readonly specialStats: StatValue[] = [
    { label: 'FUERZA', value: 6, max: 10 }, { label: 'PERCEPCIÓN', value: 7, max: 10 },
    { label: 'RESISTENCIA', value: 5, max: 10 }, { label: 'CARISMA', value: 4, max: 10 },
    { label: 'INTELIGENCIA', value: 8, max: 10 }, { label: 'AGILIDAD', value: 7, max: 10 }, { label: 'SUERTE', value: 3, max: 10 },
  ];

  readonly inventory: InventoryItem[] = [
    { id: '10mm', name: 'PISTOLA 10 MM', category: 'WEAPONS', quantity: 1, weight: 2.5, condition: 82, icon: '⌁', description: 'Arma corta confiable asignada a los reclutas de seguridad del refugio.', effect: 'DAÑO 18 // PREC 74' },
    { id: 'rifle', name: 'RIFLE DE CAZA', category: 'WEAPONS', quantity: 1, weight: 6.5, condition: 61, icon: '╱', description: 'Rifle de largo alcance con culata de madera desgastada.', effect: 'DAÑO 42 // PREC 88' },
    { id: 'helmet', name: 'CASCO DEL REFUGIO 111', category: 'APPAREL', quantity: 1, weight: 1, condition: 94, icon: '◒', description: 'Protección estándar para la cabeza. Mantiene el polvo fuera.', effect: 'DEF 3 // RES RAD +2' },
    { id: 'stimpak', name: 'STIMPAK', category: 'AID', quantity: 4, weight: 0.1, condition: 100, icon: '+', description: 'Agente de curación de emergencia. Úsalo cuando bajen las constantes vitales.', effect: 'PV +30' },
    { id: 'radaway', name: 'RADAWAY', category: 'AID', quantity: 2, weight: 0.1, condition: 100, icon: '✚', description: 'Elimina la radiación acumulada en el torrente sanguíneo.', effect: 'RAD -40' },
    { id: 'holotape', name: 'VAULT-TEC HOLOTAPE', category: 'MISC', quantity: 1, weight: 0.2, condition: 76, icon: '▣', description: 'Mensaje grabado dirigido al Supervisor.', effect: 'DATOS // CIFRADOS' },
  ];

  readonly quests: QuestLogEntry[] = [
    { id: 'signal', title: 'SIGUE LA SEÑAL', location: 'TORRE DE RADIO ANTIGUA', distance: '1.2 KM', active: true },
    { id: 'water', title: 'AGUA, AGUA POR TODAS PARTES', location: 'GRANJA ATARDECER', distance: '3.8 KM', active: false },
    { id: 'vault', title: 'UNA TRANSMISIÓN PERDIDA', location: 'VAULT 94', distance: '8.1 KM', active: false },
  ];

  readonly radioStations: RadioStation[] = [
    { id: 'freedom', name: 'RADIO LIBERTAD', frequency: '98.7 FM', signal: 94, description: 'Una emisión constante que atraviesa la estática.', playing: true },
    { id: 'vault', name: 'EMERGENCIA VAULT-TEC', frequency: '103.1 FM', signal: 68, description: 'Bucle de emergencia automático. Última actualización: hace 204 años.', playing: false },
    { id: 'numbers', name: 'SEÑAL DESCONOCIDA', frequency: '107.4 FM', signal: 31, description: 'Portadora cifrada. La fuente está en movimiento.', playing: false },
  ];

  filterInventory(category: ItemCategory | 'ALL'): InventoryItem[] {
    return category === 'ALL' ? this.inventory : this.inventory.filter(item => item.category === category);
  }
}
