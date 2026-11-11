import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import type { InventoryItem, ItemCategory } from '../models/pipboy.model';
import { PipboyService } from '../servicios/pipboy.service';

@Component({ selector: 'app-inventory', standalone: true, imports: [CommonModule], template: `
<section class="screen inventory-screen"><div class="screen-heading"><div><span class="eyebrow">INV // CAPACIDAD DE CARGA</span><h1>INVENTARIO</h1></div><span class="screen-code">{{ items.length.toString().padStart(2, '0') }} OBJETOS DETECTADOS</span></div><div class="inventory-layout"><div class="inventory-list"><div class="category-tabs"><button *ngFor="let item of categories" [class.selected]="category === item" (click)="selectCategory(item)">{{ categoryLabels[item] }}</button></div><div class="list-header"><span>OBJETO</span><span>CANT.</span><span>PESO</span></div><button *ngFor="let item of items; let i = index" class="inventory-row" [class.selected]="selected?.id === item.id" (click)="selectedId = item.id"><span class="row-number">0{{ i + 1 }}</span><span class="item-icon">{{ item.icon }}</span><span class="item-name">{{ item.name }}<small>{{ item.effect }}</small></span><b>{{ item.quantity.toString().padStart(2, '0') }}</b><em>{{ item.weight.toFixed(1) }}</em></button></div><aside class="item-detail" *ngIf="selected as item"><div class="detail-top"><span>OBJETO SELECCIONADO</span><span class="detail-code">ID-{{ item.id.toUpperCase() }}</span></div><div class="detail-icon">{{ item.icon }}</div><h2>{{ item.name }}</h2><p>{{ item.description }}</p><div class="detail-effect">{{ item.effect }}</div><div class="condition-line"><span>CONDICIÓN</span><strong>{{ item.condition }}%</strong></div><div class="meter large"><i [style.width.%]="item.condition"></i></div><div class="detail-foot"><span>PESO</span><strong>{{ item.weight.toFixed(1) }} KG</strong></div></aside></div></section>
`, })
export class InventoryComponent {
  readonly service = inject(PipboyService); readonly categories: Array<ItemCategory | 'ALL'> = ['ALL', 'WEAPONS', 'APPAREL', 'AID', 'MISC']; readonly categoryLabels: Record<ItemCategory | 'ALL', string> = { ALL: 'TODOS', WEAPONS: 'ARMAS', APPAREL: 'VESTIMENTA', AID: 'AYUDA', MISC: 'VARIOS' }; category: ItemCategory | 'ALL' = 'ALL'; selectedId = this.service.inventory[0].id;
  get items(): InventoryItem[] { return this.service.filterInventory(this.category); }
  get selected(): InventoryItem | undefined { return this.items.find(item => item.id === this.selectedId) ?? this.items[0]; }
  selectCategory(category: ItemCategory | 'ALL') { this.category = category; this.selectedId = ''; }
}
