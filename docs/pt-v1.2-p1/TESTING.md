# TESTING.md

Versión: PT v1.2 P1

Estado:
Guía Oficial de Pruebas

---

# PROPÓSITO

Este documento define la estrategia de pruebas para Glitch AQP.

Toda modificación deberá verificarse antes de considerarse terminada.

Las pruebas existen para garantizar estabilidad, evitar regresiones y mantener la confianza en cada despliegue.

---

# FILOSOFÍA

No asumir.

↓

Verificar.

↓

Corregir.

↓

Volver a probar.

↓

Documentar.

---

# OBJETIVOS

Las pruebas deberán responder.

¿La funcionalidad cumple el objetivo?

¿Rompe algo existente?

¿Introduce regresiones?

¿Mantiene el rendimiento?

¿Respeta los permisos?

¿Funciona en distintos escenarios?

---

# PIRÁMIDE DE PRUEBAS

1. Validaciones estáticas.

↓

2. Pruebas unitarias.

↓

3. Pruebas de integración.

↓

4. Pruebas End-to-End.

↓

5. Verificación manual.

Cada nivel complementa al anterior.

---

# VALIDACIONES ESTÁTICAS

Antes de ejecutar cualquier prueba.

Verificar.

Compilación.

Lint.

TypeScript.

Imports.

Dependencias.

Variables de entorno.

---

# PRUEBAS UNITARIAS

Cada función crítica deberá poder evaluarse de forma aislada.

Ejemplos.

Conversión de datos.

Validaciones.

Utilidades.

Formateadores.

Cálculos.

No dependen de la interfaz.

---

# PRUEBAS DE INTEGRACIÓN

Comprobar que varios componentes colaboran correctamente.

Ejemplos.

Frontend ↔ API.

Frontend ↔ Supabase.

Autenticación.

Reproductor.

NΞON.

Sistema de roles.

---

# PRUEBAS END-TO-END

Simular el recorrido completo del usuario.

Ejemplos.

Registro.

Inicio de sesión.

Creación de playlist.

Cambio de rol.

Acceso al panel DJ.

Acceso al panel Admin.

Uso del descargador.

Conversación con NΞON.

---

# PRUEBAS MANUALES

Toda funcionalidad visible deberá verificarse manualmente antes de publicar.

No confiar únicamente en pruebas automáticas.

---

# MATRIZ DE DISPOSITIVOS

Verificar cuando sea posible.

PC de gama baja.

PC de gama media.

Pantallas pequeñas.

Pantallas grandes.

Modo oscuro.

Modo claro.

Conexión rápida.

Conexión lenta.

---

# MATRIZ DE NAVEGADORES

Probar.

Chrome.

Edge.

Firefox.

Otros navegadores compatibles según las necesidades del proyecto.

---

# CASOS LÍMITE

Toda función deberá considerar.

Datos vacíos.

Valores máximos.

Valores mínimos.

Errores de red.

Sesión expirada.

Permisos insuficientes.

Recursos inexistentes.

---

# SEGURIDAD

Comprobar.

Accesos sin autorización.

Rutas protegidas.

Cambios de rol.

Operaciones administrativas.

Políticas RLS.

Nunca confiar únicamente en el frontend.

---

# RENDIMIENTO

Verificar.

Tiempo de carga.

Uso de memoria.

Fluidez.

Consultas repetidas.

Uso de CPU.

No aceptar degradaciones significativas sin justificación.

---

# ACCESIBILIDAD

Comprobar.

Contraste.

Navegación por teclado.

Etiquetas.

Mensajes de error claros.

Compatibilidad con escalado.

---

# CHECKLIST PRE-COMMIT

□ Compila correctamente.

□ Sin errores de TypeScript.

□ Sin errores de lint.

□ Funcionalidad validada.

□ Sin console.log de depuración.

□ Sin archivos temporales.

□ Documentación actualizada si aplica.

---

# CHECKLIST PRE-DEPLOY

□ Autenticación validada.

□ Roles verificados.

□ Consultas optimizadas.

□ Variables de entorno correctas.

□ Recursos cargan correctamente.

□ Rendimiento aceptable.

□ No existen errores críticos conocidos.

---

# REGRESIONES

Si una corrección rompe otra funcionalidad.

La prioridad es restaurar la estabilidad.

Nunca añadir soluciones temporales sin documentarlas.

Registrar la incidencia en KNOWN_ISSUES.md o TECH_DEBT.md cuando corresponda.

---

# PRINCIPIO FINAL

Una funcionalidad no está terminada cuando compila.

Está terminada cuando demuestra, mediante pruebas, que funciona correctamente sin comprometer el resto del sistema.