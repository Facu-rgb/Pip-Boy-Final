import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, ApiUser, Cart, Purchase, Song } from './servicios/api.service';

type MainTab = 'STAT' | 'INV' | 'DATA' | 'MAP' | 'RADIO';
type StatSubTab = 'ESTADO' | 'ESPECIAL' | 'VENTAJAS';
type DataSubTab = 'RELOJ' | 'STATS' | 'CONFIGURACIÓN';
type AuthMode = 'LOGIN' | 'REGISTRO';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="reference-app">
      <section class="reference-terminal" [class.theme-amber]="accentColor === 'amber'" [class.theme-cyan]="accentColor === 'cyan'">
        <header class="reference-header">
          <button class="vault-button" aria-label="Abrir menú del refugio">✹</button>
          <nav class="main-tabs" aria-label="Navegación principal">
            <button *ngFor="let tab of mainTabs" [class.active]="activeTab === tab" (click)="selectTab(tab)">{{ tab }}</button>
          </nav>
          <button class="status-button" aria-label="Abrir acceso de usuario" (click)="showAuth = true">{{ user ? '◉' : '▤' }}</button>
        </header>

        <section class="subnav-row">
          <nav class="sub-tabs" aria-label="Subnavegación">
            <ng-container *ngIf="activeTab === 'STAT'">
              <button *ngFor="let sub of statTabs" [class.active]="activeStatTab === sub" (click)="activeStatTab = sub">{{ sub }}</button>
            </ng-container>
            <ng-container *ngIf="activeTab === 'DATA'">
              <button *ngFor="let sub of dataTabs" [class.active]="activeDataTab === sub" (click)="activeDataTab = sub">{{ sub }}</button>
            </ng-container>
            <span *ngIf="activeTab === 'INV'" class="sub-title">CARRITO // {{ cart.items.length }} CANCIONES</span>
            <span *ngIf="activeTab === 'MAP'" class="sub-title">MAPA LOCAL</span>
            <span *ngIf="activeTab === 'RADIO'" class="sub-title">RADIO // CATÁLOGO DE TRANSMISIONES</span>
          </nav>
          <span class="demo-mode">{{ user ? ('OPERADOR // ' + user.nombre.toUpperCase()) : 'MODO DEMO' }}</span>
        </section>

        <section class="reference-content">
          <div class="instrument-shell">
            <span class="corner-marker marker-left-top">—</span><span class="corner-marker marker-right-top">—</span>
            <span class="corner-marker marker-left-bottom">—</span><span class="corner-marker marker-right-bottom">—</span>

            <section *ngIf="activeTab === 'STAT' && activeStatTab === 'ESTADO'" class="module-grid status-module">
              <div class="readout-column"><small>ESTADO VITAL</small><strong>ESTABLE</strong><span>SIN EFECTOS ACTIVOS</span><small>RAD // 014</small><div class="mini-meter"><i style="width:36%"></i></div><small>CONDICIÓN</small><strong>BUENA</strong><div class="mini-meter"><i style="width:82%"></i></div></div>
              <div class="status-core"><span class="core-cross">+</span><div class="core-ring"></div><strong>SUJETO 001</strong><span>NIVEL 06 // SUPERVIVIENTE</span></div>
              <div class="readout-column right"><small>LECTURAS</small><strong>HP {{ hp }}/115</strong><span>AP {{ ap }}/90</span><small>ÚLTIMA REVISIÓN</small><span>{{ localTime }}</span><span>SISTEMA NOMINAL</span></div>
            </section>

            <section *ngIf="activeTab === 'STAT' && activeStatTab === 'ESPECIAL'" class="special-module">
              <div class="module-heading"><span>S.P.E.C.I.A.L.</span><small>MATRIZ DE ATRIBUTOS</small></div>
              <div class="special-list"><div *ngFor="let stat of specialStats" class="special-row"><b>{{ stat.name }}</b><span class="special-controls"><button (click)="changeSpecial(stat, -1)">−</button><strong>{{ stat.value }}</strong><button (click)="changeSpecial(stat, 1)">+</button></span><span class="blocks"><i *ngFor="let block of blocks" [class.on]="block <= stat.value"></i></span></div></div>
            </section>

            <section *ngIf="activeTab === 'STAT' && activeStatTab === 'VENTAJAS'" class="perks-module">
              <div class="module-heading"><span>VENTAJAS ACTIVAS</span><small>REGISTRO DE SUPERVIVIENTE</small></div>
              <div class="perk-list"><div *ngFor="let perk of perks" class="perk-card"><span>{{ perk.icon }}</span><div><strong>{{ perk.name }}</strong><small>{{ perk.description }}</small></div><b>{{ perk.level }}</b></div></div>
            </section>

            <section *ngIf="activeTab === 'INV'" class="inventory-module">
              <div class="module-heading"><span>CARRITO DE RADIO</span><small>{{ user ? ('TOTAL $' + cart.total.toFixed(2)) : 'INICIAR SESIÓN' }}</small></div>
              <div *ngIf="!user" class="empty-message">INICIÁ SESIÓN PARA VER TU CARRITO</div>
              <div class="inventory-list" *ngIf="user"><div *ngFor="let item of cart.items" class="inventory-row"><span class="item-symbol">♫</span><div><strong>{{ item.title }}</strong><small>{{ item.artist }} // {{ item.genre }} // x{{ item.quantity }}</small></div><b>$ {{ item.subtotal.toFixed(2) }}</b><button class="remove-item" (click)="removeFromCart(item.songId)">✕</button></div><small *ngIf="cart.items.length === 0" class="empty-message">CARRITO VACÍO // ELEGÍ UNA TRANSMISIÓN EN RADIO</small></div>
              <div class="cart-actions" *ngIf="user && cart.items.length"><button class="pip-button" (click)="checkout()">COMPRAR // GENERAR TICKET PDF</button></div>
            </section>

            <section *ngIf="activeTab === 'DATA' && activeDataTab === 'RELOJ'" class="clock-module"><span class="clock-label">HORA LOCAL DEL DISPOSITIVO</span><strong>{{ localTime }}</strong><span>{{ localDate }}</span><div class="clock-line"></div><small>HORA OBTENIDA DEL EQUIPO // ZONA HORARIA LOCAL</small></section>
            <section *ngIf="activeTab === 'DATA' && activeDataTab === 'STATS'" class="data-stats-module"><div class="module-heading"><span>ESTADÍSTICAS</span><small>REGISTRO DE SUPERVIVENCIA</small></div><div class="data-stat-row" *ngFor="let reading of readings"><span>{{ reading.name }}</span><strong>{{ reading.value }}</strong><i><b [style.width.%]="reading.percent"></b></i></div><div class="history-box"><div class="module-heading"><span>HISTORIAL DE COMPRAS</span><small>{{ purchases.length }} REGISTROS</small></div><div *ngIf="!user" class="empty-message">INICIÁ SESIÓN PARA CONSULTAR COMPRAS</div><div *ngFor="let purchase of purchases" class="purchase-row"><span>{{ purchase.ticketCode }}</span><b>$ {{ purchase.total.toFixed(2) }}</b><button class="config-control" (click)="downloadTicket(purchase.id)">PDF</button></div></div></section>
            <section *ngIf="activeTab === 'DATA' && activeDataTab === 'CONFIGURACIÓN'" class="config-module"><div class="module-heading"><span>CONFIGURACIÓN</span><small>TERMINAL // 3000</small></div><div class="config-row"><span>COLOR DEL TERMINAL</span><button class="config-control" (click)="cycleColor()">{{ accentColor.toUpperCase() }}</button></div><div class="config-row"><span>IDIOMA</span><button class="config-control" (click)="toggleLanguage()">{{ languageLabel }}</button></div><div class="config-row"><span>SONIDO</span><button class="config-control" (click)="soundEnabled = !soundEnabled">{{ soundEnabled ? 'ACTIVADO' : 'SILENCIADO' }}</button></div><div class="config-row"><span>CUENTA</span><button class="config-control" (click)="user ? logout() : (showAuth = true)">{{ user ? 'CERRAR SESIÓN' : 'INGRESAR' }}</button></div><div class="config-row"><span>SCANLINES</span><b>ACTIVADAS</b></div></section>

            <section *ngIf="activeTab === 'MAP'" class="map-module"><div class="map-grid-lines"></div><span class="map-pin pin-vault">C</span><span class="map-pin pin-town">●</span><span class="map-pin pin-camp">◆</span><span class="map-label label-vault">CIPOLLETTI</span><span class="map-label label-town">NEUQUÉN</span><span class="map-label label-camp">ISLA JORDÁN</span><div class="map-coordinates">38°56′S // 67°59′O // RÍO NEGRO</div></section>

            <section *ngIf="activeTab === 'RADIO'" class="radio-module radio-store-module">
              <div class="module-heading"><span>RADIO // MERCADO</span><small>{{ songs.length }} TRANSMISIONES DISPONIBLES</small></div>
              <div class="radio-toolbar"><input [(ngModel)]="searchTerm" (keyup.enter)="loadSongs()" placeholder="BUSCAR SEÑAL..." aria-label="Buscar canciones"><select [(ngModel)]="genreFilter" (change)="loadSongs()"><option value="">TODOS LOS GÉNEROS</option><option *ngFor="let genre of genres" [value]="genre">{{ genre }}</option></select><button class="filter-button" [class.active]="favoritesOnly" (click)="toggleFavoritesFilter()">♥ FAVORITAS</button></div>
              <div *ngIf="loadingSongs" class="empty-message">SINTONIZANDO CATÁLOGO...</div>
              <div *ngIf="!loadingSongs && songs.length === 0" class="empty-message">NO HAY SEÑALES CON ESE FILTRO</div>
              <div *ngFor="let song of songs" class="station-row song-card" [class.tuned]="song.favorite"><div class="song-cover"><img *ngIf="song.coverImage" [src]="song.coverImage" [alt]="song.title"><span *ngIf="!song.coverImage">♫</span></div><div class="song-info"><strong>{{ song.title }}</strong><small>{{ song.artist }} // {{ song.genre }} // {{ formatDuration(song.durationSeconds) }}</small><span>{{ song.description || 'Transmisión recuperada del yermo.' }}</span></div><div class="song-price">$ {{ song.price.toFixed(2) }}</div><button class="favorite-button" [class.active]="song.favorite" (click)="toggleFavorite(song)" [attr.aria-label]="song.favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'">{{ song.favorite ? '♥' : '♡' }}</button><button class="buy-button" (click)="addToCart(song)">AÑADIR</button></div>
              <div class="frequency-line"><span>88</span><i><b style="width:78%"></b></i><span>108 MHZ</span></div>
            </section>

            <section *ngIf="activeTab === 'DATA' && activeDataTab === 'CONFIGURACIÓN' && user?.rol === 'admin'" class="admin-module">
              <div class="module-heading"><span>ADMIN // NUEVA TRANSMISIÓN</span><small>CRUD DE PRODUCTOS</small></div>
              <div class="admin-form"><input [(ngModel)]="adminForm.title" placeholder="TÍTULO"><input [(ngModel)]="adminForm.artist" placeholder="ARTISTA"><input [(ngModel)]="adminForm.genre" placeholder="GÉNERO"><input [(ngModel)]="adminForm.price" type="number" placeholder="PRECIO"><input type="file" accept="image/*" (change)="onCoverSelected($event)" aria-label="Subir portada"><button class="pip-button" (click)="createAdminSong()">PUBLICAR CANCIÓN</button></div>
            </section>
          </div>

          <div class="loadout-row" aria-label="Equipamiento actual"><div class="gear-cell weapon-cell"><span class="pistol-shape"></span></div><div class="gear-cell ammo-cell"><span>⌖</span><strong>{{ cart.items.length }}</strong></div><div class="gear-cell armor-cell"><span class="helmet-shape"></span></div><div class="gear-cell stat-cell"><span>♢</span><strong>10</strong></div><div class="gear-cell stat-cell"><span>ϟ</span><strong>20</strong></div><div class="gear-cell stat-cell"><span>◈</span><strong>{{ favoritesCount }}</strong></div></div>
          <div class="quick-row"><button (click)="useAid('STIMPAK')">STIMPAK ({{ stimpaks }})</button><button (click)="useAid('RADAWAY')">RADAWAY ({{ radaways }})</button><button *ngIf="user" (click)="selectTab('INV')">CARRITO ({{ cart.items.length }})</button></div>
          <div class="resource-strip"><div class="resource hp-resource"><strong>PV {{ hp }}/115</strong></div><div class="resource level-resource"><strong>NIVEL 6</strong><span class="level-track"><i [style.width.%]="xp"></i></span></div><div class="resource ap-resource"><strong>PA {{ ap }}/90</strong></div></div>
        </section>

        <footer class="reference-footer"><span>◉ TERMINAL ACTIVO</span><span>1–5 CAMBIAR PANTALLA</span><span>← → NAVEGAR // RADIO STORE</span></footer>

        <div *ngIf="showAuth" class="auth-overlay" (click)="showAuth = false">
          <form class="auth-panel" (submit)="$event.preventDefault(); submitAuth()" (click)="$event.stopPropagation()">
            <button type="button" class="close-panel" (click)="showAuth = false">×</button>
            <div class="module-heading"><span>{{ authMode === 'LOGIN' ? 'ACCESO VAULT-TEC' : 'REGISTRO DE OPERADOR' }}</span><small>JWT // SESIÓN SEGURA</small></div>
            <input *ngIf="authMode === 'REGISTRO'" [(ngModel)]="authForm.nombre" name="nombre" placeholder="NOMBRE DE OPERADOR" required>
            <input [(ngModel)]="authForm.email" name="email" type="email" placeholder="CORREO" required>
            <input [(ngModel)]="authForm.password" name="password" type="password" placeholder="CONTRASEÑA" required>
            <p *ngIf="authError" class="api-error">{{ authError }}</p><p *ngIf="notice" class="api-notice">{{ notice }}</p>
            <button class="pip-button" type="submit">{{ authMode === 'LOGIN' ? 'INICIAR SESIÓN' : 'CREAR CUENTA' }}</button>
            <button class="link-button" type="button" (click)="authMode = authMode === 'LOGIN' ? 'REGISTRO' : 'LOGIN'">{{ authMode === 'LOGIN' ? 'NUEVO OPERADOR // REGISTRARSE' : 'YA TENGO CUENTA // INGRESAR' }}</button>
          </form>
        </div>
      </section>
    </main>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  readonly mainTabs: MainTab[] = ['STAT', 'INV', 'DATA', 'MAP', 'RADIO'];
  readonly statTabs: StatSubTab[] = ['ESTADO', 'ESPECIAL', 'VENTAJAS'];
  readonly dataTabs: DataSubTab[] = ['RELOJ', 'STATS', 'CONFIGURACIÓN'];
  readonly blocks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  readonly specialStats = [{ name: 'FUERZA', value: 6 }, { name: 'PERCEPCIÓN', value: 7 }, { name: 'RESISTENCIA', value: 5 }, { name: 'CARISMA', value: 4 }, { name: 'INTELIGENCIA', value: 8 }, { name: 'AGILIDAD', value: 7 }, { name: 'SUERTE', value: 3 }];
  readonly perks = [{ icon: '✦', name: 'MANOS RÁPIDAS', description: 'Recarga armas con mayor velocidad.', level: 'NIV. 2' }, { icon: '◈', name: 'SUPERVIVIENTE', description: 'Obtén más salud de los alimentos.', level: 'NIV. 1' }, { icon: 'ϟ', name: 'ENTRENAMIENTO', description: 'Mejora el rendimiento del equipo.', level: 'NIV. 3' }];
  readonly readings = [{ name: 'ENEMIGOS DERROTADOS', value: '047', percent: 47 }, { name: 'UBICACIONES DESCUBIERTAS', value: '012', percent: 32 }, { name: 'MISIONES COMPLETADAS', value: '008', percent: 64 }, { name: 'CHAPAS OBTENIDAS', value: '394', percent: 78 }];
  readonly genres = ['CLÁSICOS', 'JAZZ', 'VARIEDADES', 'INSTRUMENTAL'];
  private readonly demoSongs: Song[] = [
    { id: 1, title: 'THE WANDERER', artist: 'DION', album: 'VAULT CLASSICS', genre: 'CLÁSICOS', durationSeconds: 180, price: 120, coverImage: null, audioUrl: null, description: 'Una transmisión recuperada de antes de la guerra.', favorite: false },
    { id: 2, title: 'MAYBE', artist: 'THE INK SPOTS', album: 'GALAXY NEWS', genre: 'JAZZ', durationSeconds: 165, price: 150, coverImage: null, audioUrl: null, description: 'Señal suave para explorar el yermo.', favorite: false },
    { id: 3, title: 'WANDERER PROTOCOL', artist: 'VAULT-TEC ORCHESTRA', album: 'PROTOCOLO 76', genre: 'INSTRUMENTAL', durationSeconds: 210, price: 200, coverImage: null, audioUrl: null, description: 'Tema instrumental exclusivo del terminal.', favorite: false },
  ];
  activeTab: MainTab = 'STAT';
  activeStatTab: StatSubTab = 'ESTADO';
  activeDataTab: DataSubTab = 'RELOJ';
  localTime = '';
  localDate = '';
  accentColor: 'green' | 'amber' | 'cyan' = 'green';
  languageLabel = 'ESPAÑOL';
  soundEnabled = true;
  hp = 115; ap = 90; xp = 62; stimpaks = 2; radaways = 0;
  user: ApiUser | null = null;
  songs: Song[] = [];
  cart: Cart = { items: [], total: 0 };
  purchases: Purchase[] = [];
  searchTerm = '';
  genreFilter = '';
  favoritesOnly = false;
  loadingSongs = false;
  showAuth = false;
  authMode: AuthMode = 'LOGIN';
  authError = '';
  notice = '';
  authForm = { nombre: '', email: '', password: '' };
  adminForm = { title: '', artist: '', genre: 'CLÁSICOS', price: 99, coverImage: '' };
  private clockTimer: ReturnType<typeof setInterval> | undefined;

  get favoritesCount(): number { return this.songs.filter(song => song.favorite).length; }

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
    void this.loadSongs();
    void this.restoreSession();
  }

  ngOnDestroy(): void { if (this.clockTimer) clearInterval(this.clockTimer); }
  updateClock(): void { const now = new Date(); this.localTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); this.localDate = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(); }
  changeSpecial(stat: { name: string; value: number }, amount: number): void { stat.value = Math.max(1, Math.min(10, stat.value + amount)); }
  cycleColor(): void { this.accentColor = this.accentColor === 'green' ? 'amber' : this.accentColor === 'amber' ? 'cyan' : 'green'; }
  toggleLanguage(): void { this.languageLabel = this.languageLabel === 'ESPAÑOL' ? 'ENGLISH' : 'ESPAÑOL'; }
  selectTab(tab: MainTab): void { this.activeTab = tab; if (tab === 'RADIO') void this.loadSongs(); if (tab === 'INV' && this.user) void this.loadCart(); }
  useAid(kind: 'STIMPAK' | 'RADAWAY'): void { if (kind === 'STIMPAK' && this.stimpaks > 0) { this.stimpaks--; this.hp = Math.min(115, this.hp + 30); } if (kind === 'RADAWAY' && this.radaways > 0) this.radaways--; }
  formatDuration(seconds: number): string { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }

  async restoreSession(): Promise<void> {
    if (!this.api.isAuthenticated) return;
    try { this.user = (await this.api.me()).user; await Promise.all([this.loadCart(), this.loadPurchases(), this.loadSongs()]); }
    catch { this.api.logout(); this.user = null; }
  }

  async loadSongs(): Promise<void> {
    this.loadingSongs = true;
    try {
      const result = (await this.api.songs({ search: this.searchTerm, genre: this.genreFilter, favoritas: this.favoritesOnly })).canciones;
      if (this.user) {
        const favorites = await this.api.favorites();
        const favoriteIds = new Set(favorites.favoritos.map(song => song.id));
        this.songs = result
          .map(song => ({ ...song, favorite: favoriteIds.has(song.id) }))
          .filter(song => !this.favoritesOnly || song.favorite);
      } else {
        this.songs = result;
      }
    }
    catch { this.songs = this.demoSongs.filter(song => (!this.genreFilter || song.genre === this.genreFilter) && (!this.searchTerm || `${song.title} ${song.artist}`.toLowerCase().includes(this.searchTerm.toLowerCase()))); }
    finally { this.loadingSongs = false; }
  }

  async loadCart(): Promise<void> { if (!this.user) return; try { this.cart = await this.api.cart(); } catch { this.cart = { items: [], total: 0 }; } }
  async loadPurchases(): Promise<void> { if (!this.user) return; try { this.purchases = (await this.api.purchases()).compras; } catch { this.purchases = []; } }
  openAuth(mode: AuthMode = 'LOGIN'): void { this.authMode = mode; this.authError = ''; this.showAuth = true; }

  async submitAuth(): Promise<void> {
    this.authError = ''; this.notice = '';
    try {
      const result = this.authMode === 'LOGIN' ? await this.api.login({ email: this.authForm.email, password: this.authForm.password }) : await this.api.register(this.authForm);
      this.user = result.user; this.showAuth = false; this.authForm = { nombre: '', email: '', password: '' }; this.notice = 'SESIÓN AUTORIZADA';
      await Promise.all([this.loadSongs(), this.loadCart(), this.loadPurchases()]);
    } catch (error) { this.authError = error instanceof Error ? error.message : 'No se pudo completar la operación.'; }
  }

  logout(): void { this.api.logout(); this.user = null; this.cart = { items: [], total: 0 }; this.purchases = []; this.notice = 'SESIÓN CERRADA'; }

  async toggleFavorite(song: Song): Promise<void> {
    if (!this.user) { this.openAuth(); return; }
    try { await this.api.toggleFavorite(song.id, !song.favorite); song.favorite = !song.favorite; if (this.favoritesOnly && !song.favorite) this.songs = this.songs.filter(item => item.id !== song.id); }
    catch (error) { this.notice = error instanceof Error ? error.message : 'No se pudo actualizar favoritos.'; }
  }

  toggleFavoritesFilter(): void { if (!this.user) { this.openAuth(); return; } this.favoritesOnly = !this.favoritesOnly; void this.loadSongs(); }
  async addToCart(song: Song): Promise<void> { if (!this.user) { this.openAuth(); return; } try { this.cart = await this.api.addToCart(song.id); this.notice = `${song.title} AGREGADA AL CARRITO`; } catch (error) { this.notice = error instanceof Error ? error.message : 'No se pudo agregar la canción.'; } }
  async removeFromCart(songId: number): Promise<void> { try { this.cart = await this.api.removeFromCart(songId); } catch (error) { this.notice = error instanceof Error ? error.message : 'No se pudo quitar la canción.'; } }
  async checkout(): Promise<void> { try { const result = await this.api.checkout(); this.notice = `COMPRA ${result.compra.ticketCode} CONFIRMADA`; await Promise.all([this.loadCart(), this.loadPurchases()]); this.activeTab = 'DATA'; this.activeDataTab = 'STATS'; } catch (error) { this.notice = error instanceof Error ? error.message : 'No se pudo completar la compra.'; } }
  async downloadTicket(id: number): Promise<void> { try { await this.api.downloadTicket(id); } catch (error) { this.notice = error instanceof Error ? error.message : 'No se pudo descargar el ticket.'; } }
  onCoverSelected(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => this.adminForm.coverImage = String(reader.result); reader.readAsDataURL(file); }
  async createAdminSong(): Promise<void> { if (!this.user || this.user.rol !== 'admin') { this.notice = 'SE REQUIERE NIVEL ADMINISTRADOR'; return; } try { await this.api.createSong(this.adminForm); this.adminForm = { title: '', artist: '', genre: 'CLÁSICOS', price: 99, coverImage: '' }; this.notice = 'TRANSMISIÓN PUBLICADA'; await this.loadSongs(); } catch (error) { this.notice = error instanceof Error ? error.message : 'No se pudo publicar la canción.'; } }

  @HostListener('window:keydown', ['$event']) onKeyDown(event: KeyboardEvent): void { if (event.key >= '1' && event.key <= '5') this.selectTab(this.mainTabs[Number(event.key) - 1]); if (event.key === 'ArrowRight') this.selectTab(this.mainTabs[(this.mainTabs.indexOf(this.activeTab) + 1) % this.mainTabs.length]); if (event.key === 'ArrowLeft') this.selectTab(this.mainTabs[(this.mainTabs.indexOf(this.activeTab) - 1 + this.mainTabs.length) % this.mainTabs.length]); }
}
