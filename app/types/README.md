# Tipos

Dos sitios, y la regla para elegir es una sola pregunta: **¿lo consume más de un
slice?**

- **`app/types/`** — las entidades que atraviesan la aplicación. Un `Proyecto` lo
  leen `proyectos`, `contratos`, `clientes`, `fallas`, `solar`, `fronteras`,
  `liquidaciones` y `mem`; tenerlo en un slice obligaría a los otros siete a
  importar de él.
- **`app/features/<slice>/types.ts`** — lo que solo entiende ese slice. Una
  `Frontera` fuera de `fronteras` solo se nombra por su `id`, así que ahí se queda.

Si algo empieza en un slice y acaba con tres consumidores, se sube. Al revés
también: un tipo compartido que se queda con un solo consumidor, baja.

## Qué hay

| Archivo           | Qué define                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `api.ts`          | Cómo viajan las cosas, no qué son: `Id`, `FechaISO`, `Paginado<T>`, `Opcion<T>`, `ErrorApi`              |
| `proyecto.ts`     | La planta y sus catálogos, su información técnica y sus inversionistas                                   |
| `cliente.ts`      | Quien firma —inversionista o comprador—, sus contactos y sus servicios                                   |
| `user.ts`         | `User` y `UserRole` — los 7 roles reales del backend, decodificados del JWT (`~/composables/useAuth.ts`) |
| `route-meta.d.ts` | El `meta` de ruta propio de la app. Hoy solo `mobile`, que lee `app/middleware/mobile.global.ts`         |

## Dos convenciones

**Los catálogos van como `as const` + unión de literales, no como `enum`.**
`AGENTS.md` pide `enum` para identidad de dominio, y ahí acabarán. Pero hoy hay
literales sueltos (`'en_operacion'`, `'admin'`) repartidos por las vistas del
legacy, y con un `enum` ninguno compilaría. La unión ya obliga en el código nuevo
mientras el viejo sigue válido; se convierten a `enum` cuando la fase 3 migre esos
call sites.

**Lo que no se ha verificado no se afirma.** Cada tipo dice contra qué se
comprobó su forma —un formulario, una vista— porque el backend no publica
contrato. Donde la forma se desconoce va `unknown`, nunca `any`: `any` no es
«no lo sé», es «no lo compruebes».

Un `[campo: string]: unknown` al final de una interfaz significa que el backend
devuelve más de lo que se usa hoy, y que lo listado sí está verificado.
