# SaborUPC 2.0 — mfe-pedidos (Seguimiento de pedidos)

**Dueño:** Luis · Equipo Pedidos
**Puerto:** 8084 · **Ruta:** `#/pedidos`
**Tecnología:** Lit 3.3.3 desde CDN (jsdelivr), sin paso de compilación · **Versión:** [verificar VERSION en pedidos.js]

Micro frontend nuevo que muestra los pedidos confirmados y cómo avanzan de estado automáticamente:
**Recibido → En preparación → En camino → Entregado.**

## Cómo ejecutarlo

```bash
python -m http.server 8084
```

- `http://localhost:8084/` → modo independiente, con un botón que simula un `pedido:confirmado`.
- `http://localhost:8084/contrato.html` → prueba de contrato automática.

## Contrato de montaje

| Elemento | Descripción |
|---|---|
| `<mfe-pedidos>` | Web Component hecho con Lit. El contenedor solo crea la etiqueta. |

El contenedor lo **precarga** (`precargar: true`). El listener de `pedido:confirmado` se registra apenas se ejecuta el script (no dentro del componente), así recibe los pedidos aunque el usuario no esté en `#/pedidos`. El estado vive en el módulo y el componente lo muestra al montarse.

## Eventos

| Evento | Rol | Versión | detail |
|---|---|---|---|
| `pedido:confirmado` | Escucha | 1.0 | `{ version, id, items, total, fecha }` |
| `pedido:estado` | Publica | 1.0 | `{ version: '1.0', id, estado }` |

Los estados avanzan con `setInterval`. En cada cambio se publica `pedido:estado` y el **contenedor** muestra la notificación; este MFE no sabe quién la muestra.

## Dependencias

| Dependencia | Origen | Por qué |
|---|---|---|
| Lit 3.3.3 | cdn.jsdelivr.net (`+esm`) | Build empaquetado que el navegador puede importar directo (unpkg deja imports que el navegador no resuelve). Versión fija. |
| `tokens.css` | design-system (:8085) | Las variables CSS atraviesan el Shadow DOM, con valores de respaldo. |

## Prueba de contrato (`contrato.html`)

Verifica sin el contenedor: que `<mfe-pedidos>` esté registrado, que al montarlo aparezca contenido, que al recibir un `pedido:confirmado` aparezca el pedido y que `pedido:estado` cumpla la estructura v1.0.

## Aislamiento de estilos

Shadow DOM de Lit.
