# FRONTEND.md

Versión: PT v1.2 P1

Estado:
Arquitectura Oficial del Frontend

---

# PROPÓSITO

Este documento define la arquitectura oficial del frontend de Glitch AQP.

Su objetivo es garantizar un código limpio, modular, mantenible y de alto rendimiento.

Toda modificación del frontend deberá respetar estas directrices.

---

# FILOSOFÍA

El frontend representa la experiencia del usuario.

Debe ser:

rápido

simple

modular

reactivo

estable

escalable

La prioridad siempre será la fluidez antes que la cantidad de efectos visuales.

---

# OBJETIVOS

Reducir tiempos de carga.

Reducir consumo de memoria.

Reducir trabajo del navegador.

Evitar renderizados innecesarios.

Facilitar mantenimiento.

Mantener una interfaz consistente.

---

# PILARES

Simplicidad.

↓

Modularidad.

↓

Reutilización.

↓

Rendimiento.

↓

Accesibilidad.

↓

Escalabilidad.

---

# TECNOLOGÍAS

Frontend

React

Lenguaje

TypeScript

Build

Vite

Backend

Supabase

IA

Gemini

Hosting

Vercel

---

# ESTRUCTURA GENERAL

src/

assets/

components/

features/

hooks/

layouts/

pages/

routes/

services/

stores/

styles/

types/

utils/

config/

constants/

contexts/

Cada carpeta tiene una responsabilidad específica.

---

# COMPONENTES

Los componentes deben representar únicamente interfaz.

No deben contener lógica compleja.

No deben realizar consultas SQL.

No deben comunicarse directamente con APIs externas.

Su responsabilidad es mostrar información.

---

# CLASIFICACIÓN

UI

Componentes reutilizables.

Ejemplo.

Button

Card

Modal

Input

Badge

Tooltip

---

FEATURE

Componentes propios de una funcionalidad.

Player

Playlist

Profile

DJConsole

NΞON

Downloads

AdminPanel

---

LAYOUT

Representan estructura.

Sidebar

Navbar

Footer

Container

Dashboard

---

PAGES

Representan rutas completas.

Home

Player

Profile

Admin

Events

Downloads

Settings

---

# REGLA

Un componente debe resolver una sola responsabilidad.

Si comienza a resolver varias.

Debe dividirse.

---

# TAMAÑO

Objetivo.

Menos de 200 líneas.

Aceptable.

300 líneas.

Si supera 400 líneas.

Evaluar dividir inmediatamente.

---

# PROPS

Las props deben mantenerse simples.

Evitar pasar objetos gigantes.

Evitar cadenas profundas de props.

Cuando sea necesario utilizar Context o Stores.

---

# HOOKS

Los hooks representan comportamiento.

Nunca interfaz.

Ejemplos.

usePlayer

usePlaylist

useDownloads

useNΞON

usePermissions

useTheme

useSettings

---

# SERVICES

Toda comunicación externa pertenece a services.

Supabase.

Gemini.

Edge Functions.

Storage.

YouTube.

Nunca realizar fetch directamente desde componentes.

---

# TYPES

Toda interfaz compartida deberá declararse aquí.

Nunca duplicar tipos.

---

# UTILS

Funciones puras.

Sin estado.

Sin efectos secundarios.

Reutilizables.

---

# CONFIG

Centraliza.

URLs.

Límites.

Constantes.

Buckets.

Versiones.

Nunca repetir valores en múltiples archivos.

---

# CONSTANTS

Toda cadena repetida debe convertirse en constante.

Ejemplos.

Roles.

Estados.

Eventos.

Mensajes.

Colores.

---

# ESTADO GLOBAL

Utilizar únicamente cuando realmente sea compartido.

Ejemplos.

Usuario.

Tema.

Reproductor.

NΞON.

Configuración.

Evitar convertir todo en estado global.

---

# ESTADO LOCAL

Preferir estado local cuando la información únicamente pertenece al componente.

Reduce complejidad.

Reduce renderizados.

---

# CONTEXT

Utilizar Context únicamente cuando varias ramas del árbol necesiten la misma información.

Evitar Context gigantes.

---

# PRINCIPIO FINAL

La arquitectura del frontend debe permitir añadir nuevas funcionalidades sin modificar las existentes.

Cada componente nuevo debe sentirse como una pieza independiente dentro del ecosistema Glitch AQP.

---

# FILOSOFÍA DE RENDIMIENTO

La experiencia del usuario depende más de la fluidez que de la cantidad de efectos visuales.

Siempre priorizar.

60 FPS estables.

↓

Interacción inmediata.

↓

Carga rápida.

↓

Consumo reducido.

↓

Efectos visuales.

Nunca sacrificar rendimiento por estética.

---

# PRESUPUESTO DE RENDIMIENTO

Objetivos.

Primer render inferior a 2 segundos en conexiones normales.

Interacciones inferiores a 100 ms.

Cambio de página casi instantáneo.

Animaciones fluidas.

Consumo de memoria controlado.

Estos valores sirven como referencia para futuras optimizaciones.

---

# CARGA INICIAL

La página principal debe cargar únicamente lo indispensable.

Obligatorio.

Barra de navegación.

Contenido principal.

Reproductor básico.

Estado de autenticación.

No cargar durante el inicio.

Eventos futuros.

Panel administrativo.

Consola DJ.

Descargador.

Métricas.

Documentación.

---

# CODE SPLITTING

Toda sección pesada deberá cargarse bajo demanda.

Ejemplos.

Admin.

DJ Console.

Downloads.

Settings.

NΞON avanzado.

Analytics.

Nunca incluir estas secciones dentro del bundle inicial.

---

# IMPORTACIÓN DINÁMICA

Utilizar importaciones dinámicas cuando un módulo no sea necesario al inicio.

Ejemplos.

React.lazy()

Dynamic import()

Suspense

Reducir el tamaño del JavaScript inicial.

---

# LAZY LOADING

Aplicar carga diferida a.

Imágenes.

Videos.

Fondos.

Avatares.

Miniaturas.

Componentes secundarios.

Nunca cargar recursos que todavía no son visibles.

---

# VÍDEOS DE FONDO

Los vídeos representan uno de los mayores costes de rendimiento.

Reglas.

Un único vídeo activo.

No reproducir varios fondos simultáneamente.

Pausar vídeos ocultos.

Liberar memoria cuando dejen de utilizarse.

Reducir resolución cuando sea suficiente.

Evitar vídeos extremadamente largos.

---

# IMÁGENES

Preferencias.

WebP.

AVIF cuando sea posible.

Miniaturas optimizadas.

No cargar imágenes originales de alta resolución si no son necesarias.

---

# GIFS

Evitar GIF animados pesados.

Preferir vídeo MP4 o WebM.

Reducen considerablemente el uso de CPU.

---

# ICONOS

Preferir SVG.

Evitar bibliotecas enormes de iconos si solo se utilizan unos pocos.

---

# FUENTES

Cargar únicamente los pesos necesarios.

Evitar múltiples familias tipográficas.

Utilizar preload únicamente para fuentes críticas.

---

# ANIMACIONES

Las animaciones deben utilizar preferentemente.

transform

opacity

Evitar animar.

width

height

top

left

margin

Siempre que sea posible utilizar aceleración por GPU.

---

# EFECTOS GLITCH

Los efectos glitch representan parte de la identidad visual.

Sin embargo.

Nunca deben ejecutarse continuamente.

Aplicarlos únicamente.

En eventos.

Durante hover.

Al abrir paneles.

En respuestas de NΞON.

Evitar efectos permanentes.

---

# REACT RENDERING

Evitar renderizados innecesarios.

Utilizar.

React.memo

useMemo

useCallback

Cuando exista un beneficio real.

No utilizarlos de forma indiscriminada.

---

# LISTAS

Las listas grandes deberán utilizar virtualización cuando resulte necesario.

Ejemplos.

Canciones.

Usuarios.

Logs.

Eventos.

Nunca renderizar cientos de elementos simultáneamente.

---

# SCROLL

Utilizar Intersection Observer para detectar elementos visibles.

Evitar escuchar continuamente el evento scroll.

---

# PETICIONES

Agrupar solicitudes cuando sea posible.

Evitar múltiples consultas consecutivas si una sola puede resolver el problema.

---

# CACHE

Reutilizar información ya obtenida.

Evitar descargar repetidamente los mismos recursos.

---

# ESTADO

No almacenar en memoria información que ya no se utiliza.

Liberar estados temporales.

Cerrar modales innecesarios.

Destruir componentes cuando corresponda.

---

# LIMPIEZA

Todo componente que registre.

Timers.

Listeners.

Observers.

Suscripciones.

Debe eliminarlos correctamente al desmontarse.

---

# REPRODUCCIÓN MUSICAL

El reproductor debe permanecer estable.

Cambiar de página nunca debe reiniciar la música salvo que el usuario lo solicite.

---

# NΞON

NΞON no debe inicializar todas sus funciones al cargar la página.

Inicialización progresiva.

1.

Interfaz.

2.

Contexto.

3.

Memoria.

4.

Funciones avanzadas.

Esto reduce el tiempo de carga inicial.

---

# VENTANAS MODALES

Crear únicamente cuando el usuario las abra.

No mantener decenas de modales ocultos en el DOM.

---

# OBSERVADORES

Evitar MutationObserver innecesarios.

Evitar ResizeObserver sobre muchos elementos.

Registrar únicamente cuando aporten valor.

---

# DEPURACIÓN

Eliminar antes de producción.

console.log

debuggers

Mensajes de prueba.

Código temporal.

---

# MÉTRICAS

Monitorizar periódicamente.

Tiempo de carga.

Uso de memoria.

FPS.

Consultas.

Errores.

Bundle.

Esto permitirá detectar regresiones de rendimiento.

---

# CHECKLIST DE RENDIMIENTO

Antes de publicar una nueva versión verificar.

□ No existen vídeos duplicados.

□ No existen imágenes innecesarias.

□ No existen componentes muertos.

□ No existen listeners sin limpiar.

□ No existen consultas repetidas.

□ No existen imports innecesarios.

□ El bundle no creció sin motivo.

□ Las animaciones siguen siendo fluidas.

□ La reproducción musical funciona correctamente.

□ NΞON responde sin bloquear la interfaz.

---

# PRINCIPIO FINAL

Cada nueva funcionalidad deberá justificar su impacto sobre el rendimiento.

Si una mejora visual degrada perceptiblemente la experiencia en dispositivos modestos.

Debe replantearse antes de integrarse en la plataforma.


