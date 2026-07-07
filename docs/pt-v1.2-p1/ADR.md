# ADR.md

Versión: PT v1.2 P1

Estado:
Architecture Decision Records

---

# PROPÓSITO

Este documento registra las decisiones arquitectónicas importantes tomadas durante el desarrollo de Glitch AQP.

No pretende documentar cambios pequeños.

Únicamente decisiones que afectan al diseño del sistema, rendimiento, seguridad, experiencia de usuario o mantenibilidad.

Cada decisión debe incluir el contexto, las alternativas consideradas y la justificación.

---

# FORMATO

Cada ADR seguirá esta estructura.

ID

Fecha

Estado

Contexto

Problema

Opciones consideradas

Decisión

Consecuencias

Acciones futuras

---

# ADR-001

Título

Supabase como backend principal.

Estado

Aceptado.

Contexto.

Se necesitaba un backend moderno con autenticación integrada, almacenamiento y base de datos administrada.

Alternativas.

Firebase.

Backend propio.

PocketBase.

Appwrite.

Decisión.

Adoptar Supabase como plataforma principal.

Consecuencias.

Mayor velocidad de desarrollo.

Dependencia del ecosistema Supabase.

Uso intensivo de RLS.

---

# ADR-002

Título

React + Vite.

Estado

Aceptado.

Razón.

Inicio rápido.

Bundle pequeño.

Excelente experiencia para desarrollo.

---

# ADR-003

Título

La música tiene prioridad sobre la IA.

Estado

Aceptado.

Razón.

Glitch AQP es una plataforma musical.

NΞON mejora la experiencia.

Nunca debe convertirse en el elemento principal.

Consecuencia.

La IA permanece contextual.

Nunca invade la interfaz.

---

# ADR-004

Título

Un único vídeo de fondo.

Estado

Aceptado.

Contexto.

Existían múltiples vídeos reproduciéndose simultáneamente.

Problema.

Consumo elevado de GPU.

Tirones.

Memoria.

Decisión.

Mantener únicamente un vídeo activo.

Consecuencia.

Mayor estabilidad.

Menor consumo energético.

---

# ADR-005

Título

Sistema RBAC.

Estado

Aceptado.

Decisión.

Separar User.

DJ.

Admin.

Toda autorización pertenece al backend.

Nunca al frontend.

---

# ADR-006

Título

NΞON como identidad permanente.

Estado

Aceptado.

El modelo podrá cambiar.

La personalidad nunca.

Toda evolución futura deberá respetar esta decisión.

---

# ADR-007

Título

Optimización antes que nuevas funciones.

Estado

Aceptado.

Toda nueva característica deberá justificar su impacto en rendimiento.

Si reduce perceptiblemente la fluidez.

No se integrará hasta optimizarla.

---

# PRINCIPIO FINAL

Si una propuesta contradice un ADR aceptado.

Debe abrirse un nuevo ADR.

Nunca modificar decisiones históricas sin documentar el motivo.