# DOWNLOADS.md

Versión: PT v1.2 P1

Estado:
Arquitectura Oficial del Sistema de Descargas

---

# PROPÓSITO

El sistema de descargas de Glitch AQP permite a los usuarios descargar contenido multimedia desde plataformas compatibles mediante una aplicación oficial.

El objetivo es ofrecer una experiencia extremadamente sencilla.

El usuario nunca debería preocuparse por instalar manualmente dependencias.

Todo el proceso debe sentirse como una única aplicación.

---

# FILOSOFÍA

Simplicidad.

↓

Automatización.

↓

Compatibilidad.

↓

Seguridad.

↓

Actualización.

↓

Mantenimiento.

---

# OBJETIVO

El usuario únicamente debe realizar tres pasos.

Descargar.

↓

Abrir.

↓

Usar.

Todo lo demás será gestionado automáticamente.

---

# ARQUITECTURA

Usuario

↓

Página Web

↓

Instalador

↓

Aplicación

↓

yt-dlp

↓

FFmpeg

↓

Archivo Final

La complejidad nunca debe exponerse al usuario.

---

# COMPONENTES

Frontend.

Instalador.

Aplicación principal.

Actualizador.

yt-dlp.

FFmpeg.

Configuración.

Logs.

---

# EXPERIENCIA

El usuario nunca debería ver.

Comandos.

Terminal.

Dependencias.

Variables.

Configuraciones.

Todo debe resolverse automáticamente.

---

# INSTALADOR

Actualmente existe un BAT.

En versiones futuras podrá reemplazarse por un instalador dedicado.

Mientras exista el BAT.

Debe comportarse como un instalador transparente.

---

# RESPONSABILIDADES DEL BAT

Comprobar instalación existente.

↓

Buscar la aplicación.

↓

Buscar dependencias.

↓

Actualizar si es necesario.

↓

Ejecutar la aplicación.

↓

Cerrar automáticamente.

El usuario no debe permanecer interactuando con la consola.

---

# APLICACIÓN PRINCIPAL

La aplicación representa la interfaz oficial.

Toda interacción del usuario ocurre aquí.

Nunca desde el BAT.

---

# DEPENDENCIAS

Las dependencias deben instalarse automáticamente.

Ejemplos.

yt-dlp

FFmpeg

Runtime adicional

Nunca solicitar al usuario que descargue manualmente archivos externos.

---

# DETECCIÓN

Al iniciar.

La aplicación debe comprobar.

Versión instalada.

Dependencias.

Integridad.

Permisos.

Actualizaciones.

---

# ACTUALIZACIONES

Si existe una versión más reciente.

Mostrar una notificación clara.

Nunca forzar la actualización inmediatamente.

Permitir al usuario decidir cuándo actualizar salvo en situaciones críticas.

---

# COMPATIBILIDAD

El objetivo principal es Windows.

La arquitectura deberá permitir añadir soporte para Linux y macOS en el futuro.

No escribir código dependiente de Windows cuando exista una alternativa multiplataforma.

---

# FORMATOS SOPORTADOS

Audio.

Vídeo.

Playlists.

Miniaturas cuando sea posible.

Metadatos cuando resulte útil.

La lista exacta dependerá de las capacidades de las herramientas utilizadas.

---

# PLATAFORMAS

Diseñar el sistema para trabajar con servicios compatibles con las herramientas empleadas, como:

YouTube

TikTok

Instagram

Facebook

Y otras plataformas compatibles en el futuro.

La aplicación no debe asumir que la lista permanecerá fija.

---

# CONFIGURACIÓN

La configuración debe almacenarse de forma centralizada.

Ejemplos.

Carpeta de descargas.

Formato preferido.

Calidad.

Idioma.

Actualizaciones automáticas.

Tema.

No duplicar configuraciones en distintos lugares.

---

# LOGS

Generar registros útiles para diagnóstico.

Nunca mostrar información técnica innecesaria al usuario.

Los detalles avanzados deberán estar disponibles únicamente cuando el usuario lo solicite.

---

# PRINCIPIO FINAL

El usuario debe recordar la facilidad del proceso.

Nunca las herramientas internas utilizadas para hacerlo posible.

---

# CICLO DE VIDA

El sistema de descargas seguirá un ciclo de vida controlado.

Descarga

↓

Instalación

↓

Verificación

↓

Configuración

↓

Uso

↓

Actualización

↓

Mantenimiento

Cada etapa debe poder ejecutarse de forma independiente.

---

# PRIMERA EJECUCIÓN

Durante el primer inicio.

La aplicación debe.

Crear directorios necesarios.

Verificar permisos.

Inicializar configuración.

Crear archivos de configuración por defecto.

Comprobar conectividad cuando sea necesaria.

Mostrar un recorrido de bienvenida opcional.

Nunca asumir que el usuario tiene conocimientos técnicos.

---

# VERIFICACIÓN DE INTEGRIDAD

Antes de iniciar.

La aplicación comprobará.

Existencia de archivos esenciales.

Versión instalada.

Configuración.

Estado de los componentes.

Si detecta un problema.

Intentará repararlo automáticamente cuando sea seguro hacerlo.

---

# AUTORREPARACIÓN

El sistema deberá poder restaurar componentes dañados o ausentes.

Ejemplos.

Configuración corrupta.

Recursos faltantes.

Archivos auxiliares.

Si la reparación automática falla.

Mostrar instrucciones claras para el usuario.

---

# ACTUALIZACIONES

El sistema distinguirá entre.

Actualizaciones opcionales.

Actualizaciones recomendadas.

Actualizaciones críticas.

El usuario siempre conocerá.

Versión actual.

Versión disponible.

Resumen de cambios.

Tamaño aproximado de la descarga.

---

# HISTORIAL DE VERSIONES

Cada actualización deberá registrar.

Número de versión.

Fecha.

Cambios principales.

Correcciones.

Compatibilidad.

Este historial podrá consultarse desde la aplicación.

---

# CONFIGURACIÓN

Toda la configuración deberá centralizarse.

Ejemplos.

Idioma.

Tema.

Carpeta de salida.

Notificaciones.

Actualizaciones.

Preferencias de interfaz.

Evitar múltiples archivos de configuración para un mismo propósito.

---

# PORTABILIDAD

La arquitectura deberá permitir dos modos.

Instalación estándar.

Modo portátil.

El modo portátil mantendrá todos sus datos dentro de su propia carpeta.

No modificará información del sistema salvo cuando sea estrictamente necesario.

---

# DIAGNÓSTICO

La aplicación incluirá un panel de diagnóstico.

Permitirá consultar.

Versión.

Estado general.

Ubicación de datos.

Espacio disponible.

Registro de errores recientes.

Nunca mostrar información sensible.

---

# REGISTRO DE ERRORES

Los errores deberán clasificarse.

Información.

Advertencia.

Error.

Crítico.

Cada registro incluirá.

Fecha.

Versión.

Componente.

Descripción.

Acción realizada.

---

# EXPERIENCIA DE RECUPERACIÓN

Si ocurre un fallo.

El usuario debe recibir.

Una explicación sencilla.

Una posible causa.

Los pasos recomendados.

La opción de generar un informe de diagnóstico.

Evitar mensajes técnicos incomprensibles.

---

# NOTIFICACIONES

Las notificaciones deberán ser discretas.

No interrumpir descargas.

No ocultar contenido importante.

Permitir descartarlas fácilmente.

---

# ACCESIBILIDAD

La aplicación deberá ofrecer.

Modo oscuro.

Escalado de interfaz.

Navegación mediante teclado cuando sea posible.

Textos claros.

Contraste adecuado.

---

# INTERNACIONALIZACIÓN

Todo texto visible deberá prepararse para múltiples idiomas.

No escribir cadenas directamente dentro del código.

Centralizar traducciones.

---

# TELEMETRÍA

Si en el futuro se recopilan métricas de uso.

Deberán cumplir estos principios.

Consentimiento del usuario.

Anonimización.

Transparencia.

Posibilidad de desactivarlas.

Nunca recopilar información innecesaria.

---

# COMPATIBILIDAD FUTURA

La arquitectura deberá facilitar.

Integración con la APK.

Sincronización de preferencias.

Actualizaciones compartidas.

Servicios comunes.

Reutilización de componentes.

---

# CHECKLIST DE PUBLICACIÓN

Antes de publicar una nueva versión verificar.

□ La aplicación inicia correctamente.

□ La configuración por defecto es válida.

□ Los mensajes están traducidos.

□ No existen archivos temporales innecesarios.

□ La versión es correcta.

□ El historial de cambios está actualizado.

□ La documentación refleja los cambios realizados.

---

# PRINCIPIO FINAL

El sistema de descargas debe transmitir confianza.

La instalación, actualización y mantenimiento deben sentirse como parte de una única experiencia integrada, sencilla y predecible para cualquier usuario.

