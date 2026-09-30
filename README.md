# SaborUPC · mfe-pedidos (Seguimiento de pedidos)

**Equipo:** Pedidos · **Dueño:** Luis · **Puerto local:** 8084 · **Tecnología:** Lit 3 (CDN, sin compilación)
**Versión:** 1.0.0

Micro frontend nuevo de la Actividad 2. Escucha `pedido:confirmado` y muestra la lista de
pedidos con estados que avanzan solos:
**Recibido → En preparación → En camino → Entregado**.

Es la pieza que cumple el requisito de **heterogeneidad tecnológica** del equipo Pedidos:
JavaScript con Lit, mientras el carrito sigue en JavaScript puro. Sin npm, sin bundler, sin paso
de compilación: se importa Lit directo del CDN.

## Contrato

| Aspecto | Detalle |
|---|---|
| Montaje | Web Component `<mfe-pedidos>` |
| Escucha | `pedido:confirmado` |
| Publica | `pedido:estado` v1.0 |
| Precarga | Sí, el contenedor lo precarga para no perder pedidos |

| Evento | detail |
|---|---|
| `pedido:confirmado` (consume) | `{ version: '1.0', id, items: [{ id, nombre, precio, cantidad }], total, fecha }` |
| `pedido:estado` | `{ version: '1.0', id, estado }` |

Estados válidos: `'Recibido'`, `'En preparación'`, `'En camino'`, `'Entregado'`.

## La decisión de diseño importante

**El listener de `pedido:confirmado` se registra al ejecutarse el script, no dentro del
componente.** Está arriba del todo de `pedidos.js`, junto con el `setInterval`.

Esto es obligatorio porque el contenedor marca este MFE con `precargar: true`: el script se
descarga al arrancar aunque el usuario jamás abra `#/pedidos`. Si el listener viviera dentro
del componente, y el componente solo existe cuando la ruta es `#/pedidos`, entonces todos los
pedidos confirmados mientras el usuario está mirando el catálogo se perderían.

Por eso el estado (el arreglo `pedidos`) vive **en el módulo**, no en el componente. Cuando
llega un pedido:

```
carrito:confirmado → listener del módulo → pedidos[] (siempre) → aviso interno
                                                                    ↓
                                              el componente re-renderiza si ya está en pantalla
```

El aviso interno es el evento `mfe-pedidos:cambio` sobre `document`, que el componente escucha
para re-renderizarse. Si la etiqueta todavía no existe, no hay nada que escuchar y no pasa
nada: el pedido igual quedó guardado.

## Arquitectura interna

- **Módulo (siempre activo):** `pedidos[]`, listener de `pedido:confirmado`, `setInterval`,
  `normalizarDetalle()`, publicación de `pedido:estado`.
- **Componente `<mfe-pedidos>`:** solo lee `pedidos[]` y lo dibuja con Lit. No sabe nada del
  carrito ni del contenedor.
- Un **único** `setInterval` de 6 s para toda la lista (no uno por pedido), y un pedido ya
  `Entregado` deja de avanzar.
- Cada salto de estado publica `pedido:estado` con la estructura del contrato.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `pedidos.js` | El micro frontend completo: estado del módulo + definición de `<mfe-pedidos>` |
| `index.html` | Modo independiente, con botones para simular `pedido:confirmado` |
| `contrato.html` | Prueba de contrato automática (✓/✗ en pantalla y `console.assert`) |

## Cómo ejecutar

```bash
python -m http.server 8084
```

- http://localhost:8084 → modo independiente
- http://localhost:8084/contrato.html → prueba de contrato

Lit se baja de `https://cdn.jsdelivr.net/npm/lit@3.3.3/+esm`, así que esta pieza sí necesita
internet la primera vez (queda en caché del navegador).

### Demostración del precargado en `index.html`

1. Presiona **"Simular pedido:confirmado"** sin haber montado nada → el log dice
   `<mfe-pedidos> en pantalla: NO (se guardó igual)`.
2. Presiona **"Montar `<mfe-pedidos>` ahora"** → aparecen los pedidos que se habían confirmado
   mientras la etiqueta no existía.

## Prueba de contrato

`contrato.html` corre **sin el contenedor** y verifica en tres etapas:

1. **Precarga:** con `<mfe-pedidos>` fuera del DOM, un `pedido:confirmado` se guarda igual.
   También comprueba que un pedido sin `items` válidos se descarta, y que entrar en
   `Recibido` **no** publica evento (solo se publica en cada cambio).
2. **Web Component:** la etiqueta está registrada, se puede crear con `createElement`, usa
   Shadow DOM, y al montar muestra los pedidos que aveva recibido.
3. **Eventos:** la estructura de `pedido:estado`, que los estados sean valores válidos y que
   los saltos sigan el orden del contrato sin repetir un estado.

Esta última etapa tarda ~7 s: los estados avanzan con el `setInterval` real, no con uno falso.

## Estilos

Todo vive dentro del Shadow DOM, con `var(--sabor-..., respaldo)` para cada token de
`http://localhost:8085/tokens.css`. No hay fugas de CSS hacia el contenedor ni hacia los otros
micro frontends.

## Nota para el contenedor

`pedidos.js` se descarga con `<script src>` normal (como hace `contenedor.js`), no con
`type="module"`, así que **no** se puede usar `import` estático. Por eso Lit se carga con
`import()` dinámico. Efecto secundario útil: el listener queda registrado de inmediato, sin
esperar a que termine de bajar la librería del CDN.
