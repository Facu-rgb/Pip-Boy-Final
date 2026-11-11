# Ideas de diseño — Pip-Boy Wasteland Terminal

## Tres enfoques iniciales

### Enfoque 1 — Terminal de Bóveda
Interfaz monocromática verde fósforo, con CRT, scanlines, tipografía técnica y controles como un terminal militar reparado. La emoción buscada es operar una reliquia funcional en medio del yermo.

**Probabilidad:** 0.03

### Enfoque 2 — Cartografía de Supervivencia
Una interfaz de exploración con tonos arena, verde apagado y mapas topográficos, más cercana a una libreta de campaña y a la navegación de campo.

**Probabilidad:** 0.07

### Enfoque 3 — Neon Wasteland
Un panel oscuro con verde radioactivo, ámbar y destellos de señal, construido alrededor de estados de alerta y lecturas de radio.

**Probabilidad:** 0.02

## Enfoque elegido — Terminal de Bóveda

### Design Movement
Brutalismo tecnológico retrofuturista de los años 50, reinterpretado como una pantalla CRT industrial de Fallout: funcional, austero y deliberadamente imperfecto.

### Core Principles
1. La información manda: cada elemento debe parecer una lectura instrumental, no una tarjeta decorativa.
2. El verde fósforo es el material visual principal; los estados importantes usan ámbar o rojo oxidado con moderación.
3. La composición será asimétrica, con un panel central de lectura, navegación superior y rieles laterales de estado.
4. El desgaste visual será sutil: scanlines, ruido, brillo de tubo y pequeñas variaciones de intensidad, sin ocultar la legibilidad.

### Color Philosophy
El verde fósforo representa energía, supervivencia y tecnología de otra época. El fondo negro verdoso recuerda la oscuridad del monitor CRT, mientras que el ámbar señala advertencias y el rojo oxidado reserva la tensión para estados realmente críticos. La paleta se mantiene estrecha para que el usuario sienta que mira un único dispositivo, no una aplicación moderna con muchos temas.

### Layout Paradigm
La pantalla se estructura como un terminal de muñeca: una barra de tabs superior, una lectura principal amplia, un riel de métricas a la izquierda y un panel contextual a la derecha. En vez de centrar todo en una cuadrícula perfecta, se usan bloques escalonados, líneas de medición y una zona inferior fija de recursos HP/AP/XP.

### Signature Elements
- Línea de escaneo diagonal y textura CRT siempre presentes, pero con opacidad baja.
- Marcos técnicos con esquinas recortadas, divisores punteados y etiquetas numeradas.
- Indicador de cursor tipo guion, parpadeo de señal y microtexto de sistema en mayúsculas.

### Interaction Philosophy
Cambiar de pestaña debe sentirse como girar un selector físico: respuesta inmediata, cambio de subrayado y un breve pulso de brillo. Seleccionar un objeto actualiza el panel contextual y modifica las métricas sin abrir modales innecesarios. El teclado seguirá siendo un canal real de control: 1–5 para las tabs, flechas para listas y Enter para confirmar.

### Animation
Las transiciones de panel usarán un fade corto con desplazamiento mínimo, como una lectura que se refresca. El cursor y el brillo del CRT parpadearán lentamente; los elementos de estado tendrán pulsos de 1.6 a 2.4 segundos. No se animarán tamaños ni posiciones estructurales. Se respetará `prefers-reduced-motion`, desactivando scanlines animadas y pulsos no esenciales.

### Typography System
- Titulares y tabs: `Share Tech Mono`, en mayúsculas, peso 700 y tracking amplio.
- Lecturas y microcopy: `IBM Plex Mono`, peso 400–600.
- Jerarquía: tabs de 0.75–1rem, títulos de pantalla de 1.5–2rem, valores críticos de 2–3.5rem, microtexto de 0.65–0.75rem.
- No se usará Inter: la tipografía monoespaciada es parte del dispositivo.

### Brand Essence
**Un terminal de supervivencia para explorar, medir y decidir en un mundo que ya no funciona; está hecho para jugadores que quieren sentir que cada acción pasa por una pieza de hardware real.**

Personalidad: **resistente, técnico, inquietante**.

### Brand Voice
Los titulares son breves y operativos. Las CTAs suenan a comandos y las lecturas mezclan precisión con una leve sensación de amenaza.

Ejemplos:
- “SEÑAL ESTABLE // ABRIR REGISTRO”
- “SUMINISTROS LIMITADOS // PRIORIZA TU SIGUIENTE MOVIMIENTO”

### Wordmark & Logo
El logotipo será un símbolo de tres líneas concéntricas dentro de una abrazadera hexagonal, inspirado en un dial de medición, acompañado por un wordmark condensado con una muesca vertical en la primera letra. El símbolo debe funcionar solo como favicon y como marca de esquina del terminal.

### Signature Brand Color
**Fósforo Bóveda `#79FF4A`**, un verde intenso ligeramente amarillento que mantiene legibilidad sobre negro y se siente más eléctrico que un verde estándar.

## Decisión de implementación
La experiencia será una interfaz de juego 2D en React, no una escena 3D: el objetivo del usuario es imitar la página y la imagen de referencia con inventario, stats y tabs de Pip-Boy. La lógica se mantendrá separada en `client/src/services` y `client/src/models`, las vistas en `client/src/pages` y los elementos reutilizables en `client/src/components/shared`.
