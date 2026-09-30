// Micro frontend: SEGUIMIENTO DE PEDIDOS  (equipo "Pedidos")
// Contrato: Web Component <mfe-pedidos>  (se precarga: el listener vive FUERA del componente)
// Escucha:  'pedido:confirmado'  v1.0 { version, id, items, total, fecha }
// Publica:  'pedido:estado'      v1.0 { version, id, estado }
//
// Estados válidos: 'Recibido' → 'En preparación' → 'En camino' → 'Entregado'
//
// El contenedor descarga este archivo con <script src> normal (contenedor.js:18) y, apenas
// termina el script, exige que la etiqueta ya esté registrada (contenedor.js:52). Por eso
// <mfe-pedidos> se define DE INMEDIATO, sin esperar a nada. Lit llega después y es él
// quien dibuja el contenido dentro del Shadow DOM.

const LIT_URL = 'https://cdn.jsdelivr.net/npm/lit@3.3.3/+esm';

const VERSION = '1.0.0';
const VERSION_EVENTO = '1.0';
const ESTADOS = ['Recibido', 'En preparación', 'En camino', 'Entregado'];
const INTERVALO_MS = 6000;

const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// ------------------------------------------------------------------
// ESTADO DEL MÓDULO
// Vive acá arriba, NO dentro del componente. Así el listener sigue
// ANOTANDO pedidos aunque <mfe-pedidos> no esté en pantalla: el
// contenedor lo precarga al arrancar y el usuario puede estar en el
// catálogo sin haber abierto nunca #/pedidos.
// ------------------------------------------------------------------
const pedidos = [];

function avisar() {
  document.dispatchEvent(new CustomEvent('mfe-pedidos:cambio', { detail: null }));
}

function publicarEstado(id, estado) {
  window.dispatchEvent(new CustomEvent('pedido:estado', {
    detail: { version: VERSION_EVENTO, id: id, estado: estado }
  }));
}

function avanzar(pedido) {
  const indice = ESTADOS.indexOf(pedido.estado);
  if (indice < 0 || indice >= ESTADOS.length - 1) return false;   // ya está Entregado
  pedido.estado = ESTADOS[indice + 1];
  publicarEstado(pedido.id, pedido.estado);
  return true;
}

// Solo usamos los campos del contrato v1.0; los extras se ignoran.
function normalizarDetalle(detalle) {
  if (!detalle || typeof detalle !== 'object') return null;
  if (detalle.id === undefined || !Array.isArray(detalle.items)) return null;
  const items = detalle.items
    .filter(function (it) { return it && it.id !== undefined && it.nombre !== undefined; })
    .map(function (it) {
      return {
        id: it.id,
        nombre: String(it.nombre),
        precio: Number(it.precio) || 0,
        cantidad: Number(it.cantidad) || 1
      };
    });
  if (items.length === 0) return null;
  return {
    id: detalle.id,
    items: items,
    total: Number(detalle.total) || items.reduce(function (a, it) { return a + it.precio * it.cantidad; }, 0),
    fecha: detalle.fecha || new Date().toISOString(),
    estado: ESTADOS[0]
  };
}

// ------------------------------------------------------------------
// EL LISTENER SE REGISTRA AL EJECUTARSE EL SCRIPT, no dentro del
// componente. Corre antes de que Lit termine de descargarse.
// ------------------------------------------------------------------
window.addEventListener('pedido:confirmado', function (e) {
  const pedido = normalizarDetalle(e.detail);
  if (!pedido) return;
  if (pedidos.some(function (p) { return p.id === pedido.id; })) return;   // evita duplicados
  pedidos.unshift(pedido);
  avisar();
});

// Un solo temporizador para toda la lista, no uno por pedido.
setInterval(function () {
  let cambio = false;
  pedidos.forEach(function (pedido) { if (avanzar(pedido)) cambio = true; });
  if (cambio) avisar();
}, INTERVALO_MS);

function fechaCorta(iso) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

// ------------------------------------------------------------------
// LIT — llega después. Solo se ocupa de DIBUJAR.
// ------------------------------------------------------------------
const CSS = `
  :host { display: block; font-family: var(--sabor-fuente, Arial, sans-serif); color: var(--sabor-color-texto, #1f2a37); }
  h2 { color: var(--sabor-color-primario, #0b4f8a); margin: 0 0 4px; }
  .version { font-size: 12px; color: var(--sabor-color-texto, #5b6573); }
  .nota { color: var(--sabor-color-texto, #5b6573); }
  .tarjeta {
    border: 1px solid #d8dee6;
    border-left: 5px solid var(--sabor-color-primario, #0b4f8a);
    border-radius: var(--sabor-radio, 6px);
    padding: var(--sabor-espacio-m, 16px);
    margin: var(--sabor-espacio-s, 12px) 0;
    background: var(--sabor-color-fondo, #ffffff);
  }
  .tarjeta.entregado { border-left-color: var(--sabor-color-acento, #1b7a3e); }
  .encabezado { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .num { font-weight: bold; font-size: 17px; }
  .fecha { font-size: 12px; color: var(--sabor-color-texto, #5b6573); }
  .total { font-weight: bold; color: var(--sabor-color-acento, #1b7a3e); }
  ul { margin: var(--sabor-espacio-s, 10px) 0; padding-left: 20px; }
  li { margin: 2px 0; }
  .sub { color: var(--sabor-color-texto, #5b6573); font-size: 13px; }
  .pasos { display: flex; flex-wrap: wrap; gap: 6px; margin-top: var(--sabor-espacio-s, 10px); }
  .paso {
    font-size: 12px; padding: 3px 9px; border-radius: 999px;
    background: #eef2f6; color: var(--sabor-color-texto, #5b6573); border: 1px solid transparent;
  }
  .paso.hecho { background: #eaf6ea; color: var(--sabor-color-acento, #1b7a3e); border-color: var(--sabor-color-acento, #1b7a3e); }
  .paso.actual { background: var(--sabor-color-primario, #0b4f8a); color: var(--sabor-color-fondo, #ffffff); font-weight: bold; }
`;

let lit = null;          // { html, render, css } — llega del CDN
let falloLit = null;
const raices = [];      // Shadow DOM de cada <mfe-pedidos> que ya está montado

function plantilla() {
  return lit.html`
    <h2>Seguimiento de pedidos</h2>
    <span class="version">mfe-pedidos v${VERSION} · los estados avanzan solos cada ${INTERVALO_MS / 1000} s</span>
    ${pedidos.length === 0
      ? lit.html`<p class="nota">Todavía no hay pedidos. Confirma uno desde el carrito.</p>`
      : lit.html`<p class="nota">${pedidos.length} pedido(s) recibido(s) — este MFE está precargado, así que también cuenta los que confirman mientras el usuario está en otra sección.</p>`}
    ${pedidos.map((p) => tarjeta(p))}
  `;
}

function tarjeta(p) {
  const indice = ESTADOS.indexOf(p.estado);
  const entregado = indice === ESTADOS.length - 1;
  return lit.html`
    <article class="tarjeta ${entregado ? 'entregado' : ''}">
      <div class="encabezado">
        <span class="num">Pedido #${p.id}</span>
        <span class="fecha">${fechaCorta(p.fecha)}</span>
      </div>
      <ul>
        ${p.items.map((it) => lit.html`<li>${it.cantidad} × ${it.nombre} <span class="sub">${pesos.format(it.precio * it.cantidad)}</span></li>`)}
      </ul>
      <div class="total">Total: ${pesos.format(p.total)}</div>
      <div class="pasos">
        ${ESTADOS.map((estado, i) => lit.html`
          <span class="paso ${i < indice ? 'hecho' : ''} ${i === indice ? 'actual' : ''}">${estado}</span>
        `)}
      </div>
    </article>
  `;
}

function pintarRaiz(raiz) {
  if (!lit) return;                       // todavía no llegó: la etiqueta muestra "Cargando…"
  const salida = raiz.querySelector('.salida');
  if (!salida) return;
  lit.render(plantilla(), salida);
}

function pintarTodos() {
  raices.forEach(pintarRaiz);
}

// ------------------------------------------------------------------
// COMPONENTE — se registra DE INMEDIATO, sin esperar a Lit.
// Solo es un contenedor con Shadow DOM; el dibujo lo hace Lit.
// ------------------------------------------------------------------
class MfePedidos extends HTMLElement {
  constructor() {
    super();
    const raiz = this.attachShadow({ mode: 'open' });
    raiz.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="cargando">Cargando Lit desde el CDN…</div><div class="salida"></div>';
    this._raiz = raiz;
    this._alCambiar = () => pintarRaiz(raiz);
  }

  connectedCallback() {
    if (!raices.includes(this._raiz)) raices.push(this._raiz);
    document.addEventListener('mfe-pedidos:cambio', this._alCambiar);
    this._actualizarEstadoCarga();
    pintarRaiz(this._raiz);
  }

  disconnectedCallback() {
    const i = raices.indexOf(this._raiz);
    if (i >= 0) raices.splice(i, 1);
    document.removeEventListener('mfe-pedidos:cambio', this._alCambiar);
  }

  // Mientras Lit no esté, mostramos un mensaje claro en vez de una pantalla vacía.
  _actualizarEstadoCarga() {
    const caja = this._raiz.querySelector('.cargando');
    if (!caja) return;
    if (lit) {
      caja.style.display = 'none';
    } else if (falloLit) {
      caja.textContent = 'No se pudo cargar Lit desde ' + LIT_URL + '. Revisa tu conexión.';
    } else {
      caja.textContent = 'Cargando Lit desde el CDN…';
    }
  }
}

customElements.define('mfe-pedidos', MfePedidos);   // síncrono: el contenedor lo exige

// Lit llega después y dibujamos todo lo que ya esté montado.
import(LIT_URL).then(function (mod) {
  lit = mod;
  document.querySelectorAll('mfe-pedidos').forEach(function (el) { el._actualizarEstadoCarga(); });
  pintarTodos();
  avisar();
}).catch(function (err) {
  falloLit = err;
  document.querySelectorAll('mfe-pedidos').forEach(function (el) { el._actualizarEstadoCarga(); });
  document.dispatchEvent(new CustomEvent('mfe-pedidos:error', { detail: err }));
  console.error('[mfe-pedidos] no se pudo cargar Lit desde ' + LIT_URL, err);
});

// Solo para la prueba de contrato: leer el estado del módulo sin montar nada.
window.__pedidosInterno = function () {
  return { version: VERSION, versionEvento: VERSION_EVENTO, lista: JSON.parse(JSON.stringify(pedidos)) };
};
