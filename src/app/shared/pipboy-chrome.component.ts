import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import type { PipboyTab } from '../models/pipboy.model';

@Component({
  selector: 'app-pipboy-chrome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="crt-noise" aria-hidden="true"></div>
    <header class="pip-header">
      <div class="vault-brand" aria-label="Terminal del refugio"><div class="vault-mark"><span>◌</span></div><div><strong>VAULT-TEC</strong><small>TERMINAL DE CAMPO // 3000</small></div></div>
      <div class="header-readout"><span class="status-dot"></span> CONECTADO <span class="divider">//</span> DÍA 184</div>
      <div class="header-signal">◉ <span>98.7 FM</span></div>
    </header>
    <nav class="pip-tabs" aria-label="Secciones del Pip-Boy">
      <button *ngFor="let tab of tabs; let i = index" class="pip-tab" [class.active]="activeTab() === tab" (click)="tabChange.emit(tab)"><span class="tab-index">0{{ i + 1 }}</span>{{ tabLabels[tab] }}</button>
    </nav>
    <footer class="pip-footer">
      <div class="footer-stat"><span>◈</span><span>PV</span><strong>{{ hp() }}<small>/115</small></strong><div class="mini-bar"><i [style.width.%]="(hp() / 115) * 100"></i></div></div>
      <div class="footer-stat"><span>✧</span><span>PA</span><strong>{{ ap() }}<small>/90</small></strong><div class="mini-bar"><i [style.width.%]="(ap() / 90) * 100"></i></div></div>
      <div class="footer-level"><span>NIVEL 06</span><div class="xp-bar"><i [style.width.%]="xp()"></i></div><small>{{ xp() }}/100 EXP</small></div>
      <div class="footer-hint">TAB CAMBIAR <span>▸</span> ENTER ACCEDER</div>
    </footer>
  `,
})
export class PipboyChromeComponent {
  readonly activeTab = input<PipboyTab>('STAT');
  readonly hp = input(115);
  readonly ap = input(90);
  readonly xp = input(68);
  readonly tabChange = output<PipboyTab>();
  readonly tabs: PipboyTab[] = ['STAT', 'INV', 'DATA', 'MAP', 'RADIO'];
  readonly tabLabels: Record<PipboyTab, string> = { STAT: 'EST', INV: 'INV', DATA: 'DAT', MAP: 'MAP', RADIO: 'RADIO' };
}
