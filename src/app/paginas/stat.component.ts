import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PipboyService } from '../servicios/pipboy.service';

@Component({ selector: 'app-stat', standalone: true, imports: [CommonModule], template: `
<section class="screen stat-screen"><div class="screen-heading"><div><span class="eyebrow">STAT // ESTADO PERSONAL</span><h1>ESTADO</h1></div><span class="screen-code">BIO-MÉTRICAS 01</span></div>
<div class="stat-layout"><aside class="stat-rail"><div class="rail-block"><span>VITALES</span><strong>ESTABLE</strong><em>SIN EFECTOS ACTIVOS</em></div><div class="rail-block"><span>RADIACIÓN</span><strong>014 RAD</strong><div class="meter"><i style="width:18%"></i></div></div><div class="rail-block"><span>CONDICIÓN</span><strong>BUENA</strong><div class="meter"><i style="width:78%"></i></div></div><div class="rail-note">// ÚLTIMA REVISIÓN<br>// 14:08:22<br>// SISTEMA NOMINAL</div></aside>
<div class="character-panel"><div class="target-reticle top-left">+</div><div class="target-reticle top-right">+</div><div class="target-reticle bottom-left">+</div><div class="target-reticle bottom-right">+</div><div class="character-stage"><div class="scan-ring"></div><div class="vault-figure" role="img" aria-label="Silueta de explorador del refugio"><div class="figure-head"></div><div class="figure-body"></div><div class="figure-arm arm-left"></div><div class="figure-arm arm-right"></div><div class="figure-leg leg-left"></div><div class="figure-leg leg-right"></div></div></div><div class="character-caption"><span>SUJETO 001</span><strong>HABITANTE DEL REFUGIO</strong><span>NIVEL 06 // SUPERVIVIENTE</span></div></div>
<aside class="special-panel"><div class="panel-title"><span>S.P.E.C.I.A.L.</span><small>MATRIZ DE ATRIBUTOS</small></div><div class="special-row" *ngFor="let stat of service.specialStats"><span>{{ stat.label }}</span><b>{{ stat.value }}</b><div class="stat-dots"><i *ngFor="let dot of [].constructor(10); let i = index" [class.filled]="i < stat.value"></i></div></div></aside></div></section>
`, })
export class StatComponent { readonly service = inject(PipboyService); }
