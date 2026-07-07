# CODE_STYLE.md

Versión: PT v1.2 P1

Estado:
Guía Oficial de Estilo de Código

---

# PROPÓSITO

Este documento establece las normas oficiales para escribir código dentro de Glitch AQP.

El objetivo principal no es únicamente que el código funcione.

Debe ser:

Legible.

Consistente.

Escalable.

Seguro.

Fácil de mantener.

Toda contribución deberá respetar estas reglas.

---

# FILOSOFÍA

El código se lee muchas más veces de las que se escribe.

Por ello.

La claridad tiene prioridad sobre escribir menos líneas.

Nunca sacrificar legibilidad por ahorrar caracteres.

---

# PRINCIPIOS

Simplicidad.

↓

Consistencia.

↓

Mantenibilidad.

↓

Escalabilidad.

↓

Rendimiento.

↓

Optimización.

Nunca invertir este orden.

---

# REGLA DE ORO

Antes de escribir código responder.

¿Existe ya una solución?

¿Puede reutilizarse?

¿Puede simplificarse?

¿Puede dividirse?

¿Puede documentarse mejor?

---

# NOMENCLATURA

Variables

camelCase

```ts
userProfile

playlistTracks

systemStatus
```

---

Funciones

camelCase

```ts
loadPlaylist()

changeRole()

syncPlayer()
```

Siempre comenzar con un verbo.

---

Componentes

PascalCase

```tsx
MusicPlayer

Sidebar

UserCard

NeonChat

AdminDashboard
```

---

Hooks

Siempre comenzar por

use

```ts
usePlayer()

useAuth()

useDownloads()

useNeon()
```

---

Interfaces

PascalCase

```ts
interface UserProfile

interface Playlist

interface NeonState
```

---

Enums

PascalCase

```ts
enum UserRole

enum DownloadStatus

enum ThemeMode
```

---

Constantes

UPPER_SNAKE_CASE

```ts
MAX_UPLOAD_SIZE

DEFAULT_VOLUME

MAX_PLAYLIST_ITEMS
```

---

Archivos

Componentes

PascalCase.tsx

Hooks

camelCase.ts

Utilidades

camelCase.ts

Tipos

types.ts

---

# IMPORTS

Orden obligatorio.

Librerías externas.

↓

Aliases internos.

↓

Componentes.

↓

Hooks.

↓

Services.

↓

Utilidades.

↓

Tipos.

↓

CSS.

Ejemplo.

```ts
import { useState } from "react";

import { Button } from "@/components";

import { usePlayer } from "@/hooks";

import { getTracks } from "@/services";

import { formatTime } from "@/utils";

import type { Track } from "@/types";

import "./Player.css";
```

---

# FUNCIONES

Cada función debe realizar una única tarea.

Incorrecto.

```ts
loadMusicAndCreateUserAndSendNotification()
```

Correcto.

```ts
loadMusic()

createUser()

sendNotification()
```

---

# LONGITUD

Funciones.

Ideal.

20-40 líneas.

Aceptable.

80 líneas.

Si supera aproximadamente 100 líneas.

Dividir.

---

# COMPONENTES

Un componente debe representar una única pieza visual.

Si contiene.

Consultas.

Lógica.

Estados complejos.

Animaciones.

Eventos.

Renderizado.

Probablemente necesita dividirse.

---

# COMENTARIOS

Comentar únicamente cuando el motivo no sea evidente.

Incorrecto.

```ts
// suma uno

count++
```

Correcto.

```ts
// Se mantiene este cálculo para preservar compatibilidad con
// el algoritmo de reputación anterior.
```

---

# TODO

Todos los TODO deberán seguir este formato.

```ts
TODO(pt-v1.3):

Implementar caché para playlists públicas.
```

Nunca dejar TODO genéricos.

---

# MAGIC NUMBERS

Evitar.

Incorrecto.

```ts
if (volume > 87)
```

Correcto.

```ts
if (volume > MAX_VOLUME)
```

---

# RETURN TEMPRANO

Preferir.

```ts
if (!user)

return;

...
```

Antes que múltiples bloques anidados.

---

# ANIDAMIENTO

Máximo recomendado.

Tres niveles.

Si se supera.

Extraer funciones.

---

# ERRORES

Capturar únicamente los errores que realmente puedan manejarse.

Nunca ocultar errores silenciosamente.

---

# LOGS

Desarrollo.

Permitidos.

Producción.

Únicamente logs útiles.

Eliminar console.log de depuración antes del despliegue.

---

# PRINCIPIO FINAL

El mejor código no es el más corto.

Es el que otro desarrollador puede comprender rápidamente, modificar con seguridad y mantener durante años sin introducir errores.

