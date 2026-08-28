# Registros: procedencia del respaldo y WIP rescatado

**2026-08-28.** Esta carpeta vive en la rama `feat/registros-proyecto-documentos`, que es
**respaldo, no avance**: no se mergea a nada.

## Qué pasó

La carpeta del frontend anterior (`sole-open-source/unergy-operaciones-frontend`) se borró el
2026-08-28 a las 10:59 al migrar al frontend v2. Dos cosas no habían sido empujadas y por eso
**no migraron**; ambas se recuperaron desde la papelera de reciclaje:

1. **La sección Registros** — commit `b1ab43d`, 4 archivos, +637 líneas. Reubicada bajo
   `legacy/src/views/Registros/` en el commit `d7e2d17` de esta rama.
2. **El WIP de la vista de Servicios** — cambios sin commitear de **otra sesión**, que se
   conservan aquí abajo para que su autor los retome. No son trabajo de la sesión Registros.

## Contenido de esta carpeta

| Archivo | Qué es |
|---|---|
| `PORTAR-REGISTROS-A-SHADCN.md` | Qué de las 637 líneas sirve al portar a shadcn-vue, y qué se tira |
| `ServiciosUnificadoView-wip-otra-sesion-20260828.patch` | El diff tal cual (+75/-4), rutas `src/…` del repo viejo |
| `…legacy-paths.patch` | El mismo diff con las rutas reescritas a `legacy/src/…` (donde vive hoy ese código) |
| `ServiciosUnificadoView.BASE-b1ab43d.vue` | El archivo **sin** el WIP, tal como estaba en la base del diff |
| `ServiciosUnificadoView.CON-WIP.vue` | El archivo **con** el WIP aplicado |

Los dos `.vue` completos van versionados **a propósito**: el commit `b1ab43d` no es alcanzable
desde esta rama, así que su blob base no está en el remoto y `git apply -3` no tendría contra
qué resolver en un clon nuevo. Con el BASE a mano el merge manual siempre es posible.

## Cómo aplicarlo

El archivo también cambió en `legacy/` desde entonces, así que un `git apply`
directo **falla**. El 3-way sí funciona (deja conflictos a resolver):

```bash
git apply -3 docs/registros/ServiciosUnificadoView-wip-otra-sesion-20260828.legacy-paths.patch
```

Si el 3-way no encuentra el blob base (clon nuevo), comparar a mano:
`ServiciosUnificadoView.BASE-b1ab43d.vue` es el antes y `…CON-WIP.vue` el después; el delta
entre esos dos es exactamente lo que hay que llevar al archivo actual.

## La rama de Registros es respaldo, no avance

La rama `feat/registros-proyecto-documentos` (frontend) **no se mergea a nada**: quedó como
respaldo del trabajo que no migró. El código está bajo `legacy/src/views/Registros/`, o sea
en el codebase viejo, y no aparece en el frontend v2 que corre en `localhost:3000`.

Qué de esas 637 líneas sirve el día que se porte a shadcn-vue está en
**[PORTAR-REGISTROS-A-SHADCN.md](PORTAR-REGISTROS-A-SHADCN.md)**. Resumen de una línea: se
salvan unas 250 líneas de lógica (agrupación de campos, guardado parcial, contrato de la
API); el template y las 97 líneas de estilo son PrimeVue y paleta a mano, y se tiran.

## Origen exacto

- Rama recuperada: `feat/registros-proyecto-documentos` @ `b1ab43d` (repo anterior)
- `git fsck --full` sobre la copia recuperada: sin corrupción (solo objetos dangling normales)
- Backend que alimenta la sección: rama homónima de `klima-open-source/unergy-operaciones-backend`

**Refs que quedaron solo en la copia local recuperada y NO se subieron** (por decisión
explícita): `deploy/tsf-sync` (`3e77773`), `respaldo-gestion-documental` (`79d9778`),
`backup/pre-sync-20260625` (`1036b07`) y la punta divergente de `energia-transada`
(`bce4200`). Si alguna importa, hay que rescatarla antes de borrar la copia local.
