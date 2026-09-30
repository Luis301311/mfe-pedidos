# SaborUPC · mfe-pedidos (Seguimiento de pedidos)

**Equipo:** Pedidos · **Dueño:** Luis · **Puerto local:** 8084 · **Tecnología:** Lit 3 (CDN, sin compilación)

Lista los pedidos confirmados y avanza su estado automáticamente:
Recibido → En preparación → En camino → Entregado.

## Contrato

- Define la etiqueta `<mfe-pedidos>`.
- Escucha: `pedido:confirmado`
- Publica: `pedido:estado`
- Se **precarga** desde el contenedor para no perder pedidos.

## Cómo ejecutar

```bash
python -m http.server 8084
```

- http://localhost:8084 → modo independiente
- http://localhost:8084/contrato.html → prueba de contrato
