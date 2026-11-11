import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface ApiUser { id: number; nombre: string; email: string; rol: 'usuario' | 'admin'; }
export interface Song { id: number; title: string; artist: string; album: string | null; genre: string; durationSeconds: number; price: number; coverImage: string | null; audioUrl: string | null; description: string | null; favorite: boolean; }
export interface CartItem { songId: number; title: string; artist: string; genre: string; coverImage: string | null; unitPrice: number; quantity: number; subtotal: number; }
export interface Cart { items: CartItem[]; total: number; }
export interface Purchase { id: number; total: number; status: string; ticketCode: string; purchasedAt: string; items: Array<{ titulo: string; artista: string; cantidad: number; precio_unitario: number }>; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'pipboy_jwt';
  /** En local, PHP se inicia con: php -S localhost:8000 -t api_proyecto/public. */
  private readonly baseUrl = (globalThis as { PIPBOY_API_URL?: string }).PIPBOY_API_URL || 'http://localhost:8000';

  get token(): string | null { return localStorage.getItem(this.tokenKey); }
  get isAuthenticated(): boolean { return Boolean(this.token); }

  private async request<T>(path: string, method = 'GET', body?: unknown, params?: HttpParams, responseType: 'json' | 'blob' = 'json'): Promise<T> {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (this.token) headers = headers.set('Authorization', `Bearer ${this.token}`);
    const options = { headers, params, body, responseType: responseType as 'json' } as never;
    return firstValueFrom(this.http.request<T>(method, `${this.baseUrl}${path}`, options));
  }

  async register(payload: { nombre: string; email: string; password: string }): Promise<{ user: ApiUser; token: string }> {
    const result = await this.request<{ user: ApiUser; token: string }>('/usuarios/registro', 'POST', payload);
    localStorage.setItem(this.tokenKey, result.token);
    return result;
  }

  async login(payload: { email: string; password: string }): Promise<{ user: ApiUser; token: string }> {
    const result = await this.request<{ user: ApiUser; token: string }>('/usuarios/login', 'POST', payload);
    localStorage.setItem(this.tokenKey, result.token);
    return result;
  }

  logout(): void { localStorage.removeItem(this.tokenKey); }
  me(): Promise<{ user: ApiUser }> { return this.request('/usuarios'); }
  async songs(params: { search?: string; genre?: string; favoritas?: boolean } = {}): Promise<{ canciones: Song[] }> {
    let query = new HttpParams();
    if (params.search) query = query.set('buscar', params.search);
    const result = await this.request<{ productos: Array<Record<string, unknown>> }>('/productos', 'GET', undefined, query);
    const canciones = result.productos.map((producto) => ({
      id: Number(producto['id']),
      title: String(producto['nombre'] ?? ''),
      artist: 'RADIO VAULT-TEC',
      album: null,
      genre: 'CLÁSICOS',
      durationSeconds: 180,
      price: Number(producto['precio'] ?? 0),
      coverImage: typeof producto['imagen'] === 'string' ? producto['imagen'] : null,
      audioUrl: null,
      description: String(producto['descripcion'] ?? ''),
      favorite: false,
    } satisfies Song));
    return { canciones };
  }
  async favorites(): Promise<{ favoritos: Song[] }> {
    const result = await this.request<{ favoritos: Array<Record<string, unknown>> }>('/favoritos');
    return { favoritos: result.favoritos.map((producto) => ({
      id: Number(producto['id']), title: String(producto['nombre'] ?? ''), artist: 'RADIO VAULT-TEC',
      album: null, genre: 'CLÁSICOS', durationSeconds: 180, price: Number(producto['precio'] ?? 0),
      coverImage: typeof producto['imagen'] === 'string' ? producto['imagen'] : null, audioUrl: null,
      description: String(producto['descripcion'] ?? ''), favorite: true,
    } satisfies Song)) };
  }
  toggleFavorite(songId: number, favorite: boolean): Promise<{ ok: boolean; favorita: boolean }> {
    return this.request(favorite ? '/favoritos/agregar' : `/favoritos/eliminar/${songId}`, favorite ? 'POST' : 'DELETE', favorite ? { id_producto: songId } : undefined);
  }
  async cart(): Promise<Cart> {
    const result = await this.request<{ carrito: Array<Record<string, unknown>> }>('/carrito');
    const items = result.carrito.map((item) => ({
      songId: Number(item['id_producto']), title: String(item['nombre'] ?? ''), artist: 'RADIO VAULT-TEC',
      genre: 'CLÁSICOS', coverImage: typeof item['imagen'] === 'string' ? item['imagen'] : null,
      unitPrice: Number(item['precio_unitario'] ?? 0), quantity: Number(item['cantidad'] ?? 1),
      subtotal: Number(item['precio_unitario'] ?? 0) * Number(item['cantidad'] ?? 1),
    } satisfies Cart['items'][number]));
    return { items, total: items.reduce((total, item) => total + item.subtotal, 0) };
  }
  async addToCart(songId: number, quantity = 1): Promise<Cart> { await this.request('/carrito/agregar', 'POST', { id_producto: songId, cantidad: quantity }); return this.cart(); }
  async removeFromCart(songId: number): Promise<Cart> { await this.request(`/carrito/eliminar/${songId}`, 'DELETE'); return this.cart(); }
  updateCart(songId: number, quantity: number): Promise<Cart> { return this.request(`/carrito/actualizar/${songId}`, 'PUT', { cantidad: quantity }); }
  async checkout(): Promise<{ compra: { id: number; total: number; ticketCode: string; purchasedAt: string } }> {
    const result = await this.request<{ id_compra: number }>('/compras/finalizar', 'POST');
    return { compra: { id: result.id_compra, total: 0, ticketCode: `COMPRA-${result.id_compra}`, purchasedAt: new Date().toISOString() } };
  }
  async purchases(): Promise<{ compras: Purchase[] }> {
    const result = await this.request<{ compras: Array<Record<string, unknown>> }>('/compras');
    return { compras: result.compras.map((purchase) => ({
      id: Number(purchase['id_compra'] ?? purchase['id']), total: Number(purchase['total'] ?? 0),
      status: String(purchase['estado'] ?? 'pagada'), ticketCode: String(purchase['codigo_ticket'] ?? `COMPRA-${purchase['id_compra']}`),
      purchasedAt: String(purchase['fecha'] ?? ''), items: [],
    })) };
  }
  async downloadTicket(purchaseId: number): Promise<void> {
    const blob = await this.request<Blob>(`/tickets/${purchaseId}`, 'GET', undefined, undefined, 'blob');
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ticket-${purchaseId}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  adminSongs(): Promise<{ canciones: Song[] }> { return this.songs(); }
  createSong(song: Record<string, unknown>): Promise<{ cancion: Song }> {
    return this.request('/productos', 'POST', { nombre: song['title'], descripcion: song['description'] ?? '', precio: song['price'], imagen: song['coverImage'] ?? null });
  }
  updateSong(id: number, song: Record<string, unknown>): Promise<{ cancion: Song }> {
    return this.request(`/productos/${id}`, 'PUT', { nombre: song['title'], descripcion: song['description'] ?? '', precio: song['price'], imagen: song['coverImage'] ?? null });
  }
  archiveSong(id: number): Promise<{ ok: boolean }> { return this.request(`/productos/${id}`, 'DELETE'); }
}
