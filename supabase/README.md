# FitControl Cloud: Supabase

Esta carpeta es la fuente de verdad del backend en la nube que usan **este panel web** y la **app de escritorio**.

```
supabase/
├── functions/activar-licencia/index.ts   ← Edge Function que firma licencias para el escritorio
└── sql/01_seguridad_y_telemetria.sql      ← RLS por roles + columnas de última conexión
```

## Cómo se conectan las piezas

```
Panel web (Next.js) ──login Supabase Auth──► tablas licencias / clientes / planes (RLS por perfiles.rol)
App escritorio ──POST /functions/v1/activar-licencia──► Edge Function (service_role) ──► token firmado
```

El escritorio **nunca** consulta tablas directamente. Al cliente solo le entregas el instalador y la llave: la URL del proyecto y la llave pública ya vienen dentro del programa.

## Puesta en marcha (una sola vez, en este orden)

### 1. Desplegar la Edge Function (Dashboard, sin instalar nada)
1. Supabase Dashboard → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nombre: `activar-licencia` (exacto). Pega el contenido de `functions/activar-licencia/index.ts` y despliega.
3. En los ajustes de la función, desactiva **Verify JWT** (el escritorio no inicia sesión).
4. **Edge Functions → Secrets**:
   - `LICENSE_PRIVATE_KEY` = contenido de `C:\Users\marco\source\repos\FitControl_LLAVES_LICENCIA_NO_COMPARTIR\LICENSE_PRIVATE_KEY.txt`
   - `LICENSE_OFFLINE_DAYS` = `30`

> Con CLI: `npx supabase login`, `npx supabase link --project-ref srxxuofvxveczhrgbjid`, `npx supabase functions deploy activar-licencia --no-verify-jwt`.

### 2. Ejecutar el SQL
1. **SQL Editor** → revisa que tu usuario del panel tenga fila en `perfiles` (la consulta está al inicio del script).
2. Ejecuta `sql/01_seguridad_y_telemetria.sql`.
3. Entra al panel web y confirma que ves licencias, clientes y planes.

### 2b. Ediciones Lite / Pro / Vitalicio (`sql/02_ediciones_y_modulos.sql`)
**Orden obligatorio:** primero el SQL, después volver a desplegar la función (pegar el código nuevo de `index.ts` en `activar-licencia` → Deploy).
Si despliegas la función antes del SQL, la activación falla con «servidor no disponible» porque busca columnas que aún no existen.

1. Revisa en el script los `update` del final (asignan Lite/Pro/Vitalicio según el nombre del plan) y ejecútalo.
2. Vuelve a desplegar `activar-licencia`.
3. En el panel → **Planes** verás qué incluye cada uno; ajústalo ahí cuando quieras.
4. En cada PC: Configuración → Licencia → **Validar ahora** para recibir el token con su edición (o espera a que valide sola).

| Edición | Módulos | Usuarios | Actualizaciones |
|---|---|---|---|
| Lite | Socios, accesos, membresías, caja, reportes | 2 | Mientras pague |
| Pro | Todo + punto de venta, inventario, roles | Ilimitados | Mientras pague |
| Vitalicio | Igual que Pro, nunca vence | Ilimitados | 12 meses desde la emisión (botón «Extender actualizaciones 12 meses») |

Cada versión del programa lleva su fecha de compilación: si es posterior al fin del periodo de actualizaciones de una licencia, esa PC no la puede usar (debe quedarse en su versión o renovar actualizaciones).

### 3. Probar
Activa una llave en la app de escritorio. En **Emisión de Licencias** deben aparecer la PC, la versión y "Última conexión: hace 1 min".

## Operación diaria desde el panel

| Necesitas… | Acción en el panel |
|---|---|
| Dar de alta un cliente nuevo | Cuentas de Clientes → Emitir Licencia → copia la llave (⧉) y envíala con el instalador |
| Renovar un pago | Botón **Renovar** (suma un periodo desde la fecha de término actual) |
| Suspender por falta de pago | Interruptor verde → gris. La PC se bloquea en su siguiente validación (≤ 6 h con la app abierta, o al reiniciarla) |
| El cliente cambió de computadora | Botón **Liberar equipo** y luego el cliente activa la misma llave en la PC nueva |
| Ajustar una fecha | Editar → Fecha de Término |

La PC del cliente revalida sola al iniciar y cada 6 h mientras está abierta. Si no tiene internet, sigue funcionando hasta `LICENSE_OFFLINE_DAYS` días después de su última validación.
