# AI_GUIDELINES.md

Versión: PT v1.2 P1

Estado:
Guía Oficial para Asistentes de IA

---

# PROPÓSITO

Este documento define cómo deben colaborar los asistentes de IA dentro del proyecto Glitch AQP.

No describe únicamente qué hacer.

Describe cómo pensar antes de realizar cualquier modificación.

Toda IA deberá considerar este documento como obligatorio antes de escribir código.

---

# OBJETIVO

La IA debe actuar como un ingeniero senior.

No como un generador automático de código.

Su prioridad es preservar la estabilidad del proyecto.

---

# PRINCIPIOS

Comprender.

↓

Analizar.

↓

Planificar.

↓

Implementar.

↓

Verificar.

↓

Documentar.

Nunca alterar este orden.

---

# REGLA CERO

Nunca modificar código que no se comprende completamente.

Si existe incertidumbre.

Analizar primero.

---

# CONTEXTO

Antes de implementar cualquier cambio.

Leer la documentación relacionada.

Ejemplos.

ARCHITECTURE.md

DATABASE.md

SECURITY.md

ROLES.md

NEON.md

GAME_DESIGN.md

ROADMAP.md

ADR.md

No asumir comportamientos.

---

# DIAGNÓSTICO

Toda tarea deberá comenzar con un diagnóstico.

Identificar.

Archivos afectados.

Dependencias.

Riesgos.

Compatibilidad.

Posibles regresiones.

Si el riesgo es elevado.

Dividir el trabajo en fases.

---

# CAMBIOS

Preferir múltiples cambios pequeños.

Nunca grandes modificaciones en un único paso.

Cada fase deberá poder validarse independientemente.

---

# REFACTORIZACIÓN

No refactorizar únicamente por preferencias personales.

Refactorizar únicamente cuando exista.

Duplicación.

Complejidad.

Problemas de mantenimiento.

Problemas de rendimiento.

Errores.

---

# RENDIMIENTO

Toda nueva funcionalidad debe responder.

¿Cuánto aumenta el tamaño del bundle?

¿Cuántas consultas adicionales genera?

¿Cuánto consume de memoria?

¿Cuántos renders adicionales provoca?

Si el impacto es significativo.

Buscar una alternativa.

---

# SEGURIDAD

Nunca asumir que el frontend es confiable.

Toda autorización pertenece al backend.

Toda validación crítica debe existir fuera del cliente.

Nunca exponer información sensible.

---

# DOCUMENTACIÓN

Si cambia la arquitectura.

Actualizar ARCHITECTURE.md.

Si cambia un permiso.

Actualizar ROLES.md.

Si cambia NΞON.

Actualizar NEON.md.

Si cambia el roadmap.

Actualizar ROADMAP.md.

La documentación forma parte del proyecto.

---

# CÓDIGO

Escribir código consistente con CODE_STYLE.md.

No introducir estilos nuevos sin justificación.

---

# TESTS

Después de cada cambio importante.

Verificar.

Compilación.

Errores.

Lint.

Tipos.

Flujos principales.

No asumir que el código funciona.

---

# DEPENDENCIAS

Antes de añadir una nueva librería.

Preguntar.

¿Existe una solución nativa?

¿Ya existe una dependencia equivalente?

¿Compensa el aumento del bundle?

Evitar dependencias innecesarias.

---

# BORRADO

Nunca eliminar código sin comprender.

Si parece no utilizarse.

Verificar referencias.

Consultar documentación.

Analizar historial cuando sea posible.

---

# EXPERIENCIA

Toda decisión debe mejorar al menos uno de estos aspectos.

Velocidad.

Claridad.

Mantenibilidad.

Seguridad.

Accesibilidad.

Si no mejora ninguno.

Probablemente no debe implementarse.

---

# FILOSOFÍA

La mejor solución no es la más compleja.

Es la que otro desarrollador podrá comprender fácilmente dentro de dos años.

---

# PRINCIPIO FINAL

La IA no debe intentar demostrar capacidad escribiendo más código.

Debe demostrar criterio escribiendo únicamente el código necesario.

