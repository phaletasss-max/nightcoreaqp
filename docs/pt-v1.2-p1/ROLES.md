# ROLES.md

Versión: PT v1.2 P1

Estado:
Especificación Oficial del Sistema de Roles

---

# PROPÓSITO

Este documento define el funcionamiento oficial del sistema de roles de Glitch AQP.

Los roles determinan únicamente los permisos.

Nunca representan jerarquías sociales.

Su objetivo es organizar responsabilidades dentro de la plataforma.

Toda modificación relacionada con permisos deberá respetar este documento.

---

# FILOSOFÍA

Aplicar siempre el Principio de Menor Privilegio.

Cada usuario recibe únicamente los permisos necesarios para cumplir su función.

Ningún permiso debe concederse por comodidad o anticipación.

---

# ARQUITECTURA

Todos los permisos se validan en tres capas.

Frontend.

↓

Edge Functions.

↓

Supabase RLS.

El frontend nunca es una fuente de verdad.

Toda decisión crítica pertenece al backend.

---

# ROLES OFICIALES

Actualmente existen tres roles.

USER

↓

DJ

↓

ADMIN

En futuras versiones podrá añadirse OWNER sin modificar la arquitectura existente.

---

# USER

Representa a cualquier miembro de la comunidad.

Es el rol asignado automáticamente durante el registro.

Objetivos.

Escuchar música.

Descubrir contenido.

Crear playlists.

Participar en eventos.

Personalizar su perfil.

Interactuar con NΞON.

Nunca podrá modificar información perteneciente a otros usuarios.

---

# PERMISOS USER

Puede.

Escuchar música.

Crear playlists.

Editar únicamente su perfil.

Administrar favoritos.

Participar en encuestas.

Consultar eventos.

Usar el descargador.

Hablar con NΞON.

Consultar rankings públicos.

No puede.

Modificar roles.

Eliminar usuarios.

Acceder a paneles internos.

Modificar configuración.

Consultar métricas privadas.

Administrar eventos.

---

# DJ

Representa a los creadores de contenido.

No es un administrador.

Su función es gestionar contenido relacionado con la música y la comunidad.

---

# OBJETIVOS DEL DJ

Publicar contenido.

Gestionar encuestas.

Administrar su espacio de trabajo.

Consultar estadísticas relacionadas con su actividad.

Colaborar durante eventos.

---

# PERMISOS DJ

Puede.

Acceder a Consola DJ.

Consultar métricas DJ.

Gestionar encuestas.

Programar contenido autorizado.

Editar información de sus publicaciones.

Consultar estadísticas de reproducciones.

Ver información pública de eventos.

No puede.

Cambiar permisos.

Modificar usuarios.

Promover administradores.

Modificar configuraciones globales.

Eliminar registros administrativos.

Gestionar políticas RLS.

Acceder a Edge Functions administrativas.

---

# ADMIN

Representa al personal responsable de la administración de Glitch AQP.

Debe actuar bajo el principio de responsabilidad total.

Todas las acciones importantes deben registrarse.

---

# OBJETIVOS ADMIN

Mantener la plataforma.

Gestionar usuarios.

Resolver incidencias.

Supervisar eventos.

Administrar contenido.

Configurar parámetros generales.

Auditar el sistema.

---

# PERMISOS ADMIN

Puede.

Gestionar usuarios.

Cambiar roles.

Gestionar eventos.

Administrar encuestas.

Modificar configuraciones.

Consultar auditorías.

Acceder al panel administrativo.

Gestionar contenido.

Restaurar información cuando exista soporte.

No puede.

Acceder directamente a Secrets.

Consultar API Keys privadas.

Modificar información fuera de los mecanismos autorizados.

Ignorar registros de auditoría.

---

# OWNER

Reservado para futuras versiones.

No implementar hasta que exista una necesidad real.

Su existencia ya debe estar contemplada en el diseño para evitar futuras migraciones complejas.

---

# MATRIZ RESUMIDA

| Función | USER | DJ | ADMIN |
|---------|:----:|:--:|:-----:|
| Escuchar música | ✓ | ✓ | ✓ |
| Crear playlists | ✓ | ✓ | ✓ |
| Editar perfil propio | ✓ | ✓ | ✓ |
| Consola DJ | ✗ | ✓ | ✓ |
| Métricas DJ | ✗ | ✓ | ✓ |
| Encuestas | ✓ | ✓ | ✓ |
| Crear eventos | ✗ | ✗ | ✓ |
| Cambiar roles | ✗ | ✗ | ✓ |
| Configuración global | ✗ | ✗ | ✓ |
| Auditoría | ✗ | ✗ | ✓ |

---

# PRINCIPIO FINAL

Los roles representan únicamente permisos técnicos.

Nunca deben utilizarse como mecanismo de reconocimiento social dentro de la comunidad.

La experiencia de todos los usuarios debe sentirse igualmente importante independientemente del rol asignado.

