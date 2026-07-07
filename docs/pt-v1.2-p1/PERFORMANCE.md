# PERFORMANCE.md

Versión: PT v1.2 P1

Estado:
Guía Oficial de Rendimiento

---

# PROPÓSITO

Este documento establece los principios y objetivos de rendimiento de Glitch AQP.

Toda nueva funcionalidad deberá respetar estos lineamientos.

El rendimiento es una característica del producto.

No una optimización opcional.

---

# VISIÓN

Glitch AQP debe sentirse rápido.

No únicamente ser rápido en pruebas técnicas.

La percepción del usuario tiene prioridad.

---

# OBJETIVOS

La plataforma deberá.

Iniciar rápidamente.

Responder de forma inmediata.

Mantener animaciones fluidas.

Reducir el consumo de memoria.

Evitar bloqueos del hilo principal.

Mantener una experiencia consistente en equipos de gama media y baja.

---

# PRINCIPIOS

Menos JavaScript.

↓

Menos renders.

↓

Menos consultas.

↓

Menos animaciones.

↓

Menos memoria.

↓

Más fluidez.

---

# PRESUPUESTO

Toda nueva función deberá justificar.

Número de componentes añadidos.

Nuevas dependencias.

Consultas adicionales.

Uso de memoria.

Tiempo de carga.

Complejidad.

Si el coste supera el beneficio.

Buscar otra solución.

---

# CARGA INICIAL

La primera pantalla debe contener únicamente los recursos imprescindibles.

Todo contenido secundario deberá cargarse posteriormente.

Evitar cargar funcionalidades que el usuario aún no necesita.

---

# CARGA DIFERIDA

Aplicar carga diferida siempre que sea apropiado.

Ejemplos.

Panel administrativo.

Consola DJ.

Configuraciones.

Métricas.

Documentación.

Componentes pesados.

---

# RECURSOS

Cada recurso deberá responder.

¿Es necesario?

¿Puede comprimirse?

¿Puede reutilizarse?

¿Puede cargarse más tarde?

---

# VÍDEOS

Solo un vídeo de fondo podrá reproducirse simultáneamente.

Evitar múltiples vídeos activos.

Reducir resolución cuando sea suficiente.

Pausar reproducción cuando la pestaña no esté visible.

---

# IMÁGENES

Utilizar formatos modernos cuando sea posible.

Redimensionar antes de servir.

Evitar imágenes mayores que su tamaño de visualización.

Aplicar carga diferida en galerías.

---

# ICONOS

Preferir SVG.

Evitar múltiples librerías de iconos.

Reutilizar componentes.

---

# FUENTES

Reducir el número de familias tipográficas.

Evitar pesos innecesarios.

Cargar únicamente los caracteres requeridos cuando sea viable.

---

# ANIMACIONES

Toda animación deberá aportar valor.

Evitar efectos permanentes que consuman CPU o GPU.

Reducir intensidad en dispositivos con bajo rendimiento.

Respetar las preferencias de movimiento reducido del sistema.

---

# EFECTOS

Evitar.

Blur excesivo.

Filtros complejos.

Sombras múltiples.

Animaciones infinitas innecesarias.

Transparencias costosas.

---

# RENDERS

Evitar renders repetitivos.

Actualizar únicamente los componentes afectados.

Reducir estados compartidos innecesarios.

---

# CONSULTAS

Agrupar solicitudes cuando sea posible.

Evitar consultas duplicadas.

Aplicar paginación.

Aplicar caché cuando resulte apropiado.

---

# MEMORIA

Liberar recursos cuando ya no sean necesarios.

Eliminar listeners.

Cancelar temporizadores.

Cerrar conexiones inactivas.

---

# OBSERVABILIDAD

Medir.

Tiempo de carga.

Tiempo interactivo.

Errores.

Consumo de memoria.

Latencia.

Uso de CPU.

Los datos deben utilizarse para mejorar el producto.

---

# DISPOSITIVOS

La experiencia deberá mantenerse usable en equipos antiguos.

No asumir hardware moderno.

Las funciones avanzadas deberán degradarse de forma elegante cuando sea necesario.

---

# PRINCIPIO FINAL

Cada nueva línea de código debe justificar el coste de ejecutarse miles de veces para miles de usuarios.

