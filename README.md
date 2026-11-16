# tutosapp-web

Sitio de Tutos App (TUTOS APP S.A.S.): el inicio de la empresa, que vende el estudio a quien quiere que le hagamos software (una app para iPhone y Android, una aplicación web, un sitio o nuevas funciones para lo que ya tiene), la página de servicios, la política de privacidad de la empresa y una página para cada una de nuestras apps (hoy Ojito, Resume Roast y Roast Interview; vienen más, ver [Cómo agregar una app](#cómo-agregar-una-app)), en español y en inglés.

Se publica en **https://tutosapp.co** con GitHub Pages, cada vez que algo entra a `main`. Es HTML y CSS, sin analítica y sin cookies. El JavaScript es poco: el chat "Cuéntanos tu idea" (`site/assets/brief.js`), y sin él el formulario sigue funcionando por correo; y `site/assets/stack.js`, que mide las tarjetas de las apps del inicio y las de "Nuestro trabajo" de la página de servicios para que se apilen al hacer scroll (sin él, o con movimiento reducido, solo se desplazan).

## Páginas

| Página | Idioma principal | Otro idioma |
|---|---|---|
| Inicio | `/` español | `/en/` |
| Servicios | `/servicios/` español | `/en/services/` |
| Política de privacidad de la empresa | `/privacidad/` español | `/en/privacy/` |
| Cada app (`paths` de la app) | Ojito: `/ojito/` español; Resume Roast: `/resume-roast/` inglés; Roast Interview: `/roast-interview/` inglés | `/ojito/en/`, `/resume-roast/es/`, `/roast-interview/es/` |
| Páginas legales de cada app | dentro de la carpeta de la app, en cada idioma | ver [Páginas legales](#páginas-legales) |

El inicio está pensado para conseguir clientes: empresas, pymes y fundadores en Colombia y Latinoamérica, y empresas de Estados Unidos que buscan un equipo nearshore, que quieren una app para iPhone y Android, una aplicación web o un sitio, nuevas funciones para un producto que ya tienen, o acompañamiento mes a mes. Nuestras apps son la prueba. Todavía no hay proyectos de clientes, así que el sitio dice lo que ofrecemos y nunca que ya lo hicimos para alguien. Es tranquilo a propósito: un solo color de acento (el violeta del logo) sobre tinta y papel, mucho aire, una idea por sección y una sola imagen donde ayuda; nada se queda moviéndose solo. El poco movimiento que tiene es suave: la pantalla del titular sube a su marco una sola vez al abrir la página, y lo demás sigue al scroll o al puntero: las secciones y las tarjetas aparecen al llegar a ellas (las que van lado a lado, una tras otra), las tarjetas de las apps se apilan al bajar, los botones y las tarjetas responden al pasar el puntero o al tocarlos, y las preguntas frecuentes se abren y se cierran sin saltos. Con "reducir movimiento" todo está quieto y a la vista, y sin JavaScript las tarjetas solo se desplazan. Dice primero lo que la persona recibe, en palabras simples, y nombra la IA solo donde informa algo. De arriba a abajo:

- **Titular y acciones.** "Hacemos tu app o tu web, de la idea al lanzamiento", con dos botones: "Cuéntanos tu idea", que lleva al chat, y "Ver nuestras apps". Al lado, una pantalla real de la primera app de la lista.
- **Datos verificables.** Salen de la lista de apps: cuántas apps propias hay, cuántas ya se pueden descargar o usar, que respondemos en 2 días hábiles y que firmamos un NDA si lo piden.
- **Nuestras apps:** una tarjeta por app con lo que hace en una frase (`work.claim`), una pantalla, dónde se descarga o se usa hoy y el enlace a su página, donde están los detalles. Hasta tres apps, cada una ocupa una fila; con más, son una cuadrícula de tarjetas más pequeñas, con tantas columnas como las repartan parejo en un computador (2 para 4, 3 para 6, 4 para 8; si no, 3 con la última fila centrada). Al bajar, cada tarjeta (o cada fila de tarjetas, en la cuadrícula) se queda quieta bajo el menú y la siguiente se le pone encima, como en "Nuestro trabajo" de servicios. Si la última fila de la cuadrícula queda con menos tarjetas (5 o 7 apps, u 8 en un computador angosto), no taparía las filas de arriba y quedarían asomadas a los lados; en ese caso las tarjetas no se apilan: se desplazan y aparecen una tras otra.
- **Quiénes somos:** TUTOS APP S.A.S., Medellín y su NIT, y lo que cualquiera puede revisar en el sitio: en Ojito ninguna marca paga por su puntaje, cada app tiene publicadas su privacidad y sus términos, te responde una persona y el sitio no usa cookies ni analítica.
- **Nuestro proceso:** las seis etapas de la página de servicios (`services.<idioma>.process`), del descubrimiento a la operación, y el enlace a esa página.
- **Para quién.**
- **Dudas frecuentes:** las preguntas de la página de servicios marcadas con `'home'` en `services.<idioma>.faq`, y el enlace a todas.
- **Contacto:** el chat, qué pasa después de escribirnos, la promesa de confidencialidad, WhatsApp y correo.

No hay logos de clientes, testimonios ni cifras que no podamos probar: solo lo que es verdad (TUTOS APP S.A.S., Medellín, las apps y su estado en tiendas, las páginas legales publicadas, IA con revisión humana, NDA).

La página de servicios (`/servicios/`, `/en/services/`) cuenta lo mismo en detalle. Tiene el titular con su tarjeta del proceso, Nuestro trabajo, qué construimos (apps móviles, aplicaciones web y sitios, IA y funciones para un producto que ya existe; cada cosa con la app donde ya la usamos, si la hay), el proceso, las formas de trabajar, las preguntas frecuentes (si hacemos web, tiempos, propiedad del código, publicación en tiendas o en tu dominio, privacidad y Ley 1581, idiomas, empresas de Estados Unidos, qué hace la IA y qué hacen las personas) y el contacto con el chat. El menú del inicio la enlaza ("Servicios"), y también el pie de las páginas de la empresa. Sus datos estructurados (`Service`) y los del inicio (`makesOffer` de la organización) nombran los cuatro servicios (`services.<idioma>.serviceTypes`).

Cada app tiene su propia página, con su color, su tipografía y su estilo (o, si no trae uno, el de Tutos App), y se sostiene sola: el menú lleva el ícono y el nombre de la app y sus propias secciones, y solo un logo pequeño de Tutos App con una flechita abre la lista de apps. Ojito es clara y amable (acentos en serif y un lector de código de barras), Resume Roast es oscura y contundente (letra condensada en mayúsculas, chispas y una franja de palabras que se mueve) y Roast Interview es oscura y segura (azul eléctrico y ondas de voz). Arriba están la propuesta de valor, los botones de tienda (o "Úsala en la web", o "Próximamente") y un teléfono (o, para una app web, una ventana de navegador) con pantallas reales de la app que se cambian con botones. Siguen lo que hace por ti, cómo funciona, capturas, preguntas frecuentes, un cierre y un pie con los enlaces a **su** política de privacidad, **sus** términos y su soporte, que también están en este sitio (ver [Páginas legales](#páginas-legales)).

Para ir de una app a otra, en el menú de todas las páginas (el inicio y cada app) está el logo de Tutos App con una flechita. Al tocarlo se abre una lista pequeña con cada app (ícono, nombre y una línea), la app en la que estás marcada con su color, y abajo el inicio de Tutos App. Cerrada, en el menú no aparecen los nombres de las otras apps. Es un `popover` del navegador, sin JavaScript: se cierra con Esc o tocando afuera, se recorre con Tab y el lector de pantalla sabe si está abierta. En los navegadores que no tienen `popover` (por ejemplo Safari antes de iOS 17), el logo y la lista no se muestran, para que no aparezcan los nombres ni quede un botón que no hace nada; el resto del menú sigue igual.

Los botones que cambian la pantalla del teléfono de cada app son radios con CSS, sin JavaScript. Las animaciones (el orbe, las etiquetas que flotan, las apariciones al bajar) se apagan si el teléfono pide reducir el movimiento.

El sitio es claro, con paneles oscuros, y no cambia con el modo oscuro del teléfono. Todas las páginas tienen título, descripción, imagen para redes (Open Graph), datos estructurados (JSON-LD) y el pie con TUTOS APP S.A.S., NIT 902.125.524-7, Medellín. También están `sitemap.xml`, `robots.txt`, `404.html`, `CNAME` y los íconos.

## El chat "Cuéntanos tu idea"

Está en el contacto del inicio y de la página de servicios, y en todas las páginas (también las de las apps, las legales y la de página no encontrada) se abre desde un botón redondo fijo abajo a la derecha. El botón abre el chat en un panel (abajo a la derecha en el computador, a pantalla completa en el teléfono) sin salir de la página; en el inicio y en servicios el panel usa el mismo chat del contacto, con lo que ya se haya escrito. El panel se cierra con Esc, con su botón o tocando afuera (no al soltar afuera un arrastre que empezó adentro, como al seleccionar texto), y mientras está abierto el teclado no sale de él. El botón está desde que carga la página y nunca muestra un mensaje encima del contenido; solo en el inicio espera a que la persona baje un poco, porque la primera pantalla ya lleva al contacto (si la página no alcanza a bajar, aparece de una vez). Se esconde mientras el chat está abierto, en la sección de contacto (donde el chat ya se ve) y cuando un botón o una insignia de tienda de la página pasa por debajo. Si se cierra el panel mientras el chat envía, se puede: cuando llega la respuesta, la página no se mueve y junto al botón sale un aviso que los lectores de pantalla anuncian. Si se envió, "Idea enviada", que se va solo a los 6 segundos. Si no, "No se pudo enviar tu idea. Toca para reintentar" y un punto rojo en el botón, hasta que se abra el panel; al abrirlo están el correo y el WhatsApp ya escritos y "Reintentar el envío", que envía de nuevo las mismas respuestas. Sin JavaScript el botón no se muestra. El chat hace una pregunta a la vez y muestra las respuestas como en un chat: nombre, correo o WhatsApp, empresa (opcional), la idea, el tipo de proyecto, cuándo empezar, el presupuesto en dólares, si quiere un NDA y la autorización, que enlaza a la política de privacidad de la empresa. Al final envía las respuestas a la función `contacto-tutosapp` del backend y muestra "Te escribimos en menos de 2 días hábiles". Si la función responde 400 o 429 o si no hay red, ofrece el mismo mensaje ya escrito por correo a hola@tutosapp.co y por WhatsApp (+57 350 495 8312). Sin JavaScript es un formulario con todas las preguntas que abre el correo con las respuestas.

La dirección de la función es `CONTACT_ENDPOINT` en `scripts/build.mjs` (`https://teyhhauvvqxmwgzxpcey.supabase.co/functions/v1/contacto-tutosapp`); el build la pone en el formulario (`data-endpoint`). El contrato, que el backend también cumple:

- `POST` con JSON, sin JWT. CORS permite `https://tutosapp.co` y `http://localhost`.
- Cuerpo:
  - `nombre`: 1 a 120 caracteres.
  - `contacto`: correo o teléfono, de 3 a 160 caracteres.
  - `empresa`: de 0 a 160 caracteres.
  - `idea`: de 20 a 4000 caracteres.
  - `tipo`: `app_movil`, `app_con_ia`, `web`, `sumar_ia`, `feature` u `otro`.
  - `plazo`: `ya`, `1_3_meses`, `3_6_meses` o `explorando`.
  - `presupuesto`, en dólares: `no_se`, `menos_5k`, `5k_15k`, `15k_50k` o `mas_50k`.
  - `idioma`: `es` o `en`.
  - `nda`: booleano.
  - `consentimiento`: siempre `true`.
  - `sitio`: campo trampa para bots, siempre vacío.
- Respuestas:
  - 200 `{"ok":true}`, también, en silencio, cuando un bot llena `sitio`.
  - 400 `{"ok":false,"error":"datos"}`.
  - 429 si llegan más de 5 por IP en una hora.

Las preguntas y sus opciones están en `services.<idioma>.chat` de `scripts/build.mjs`; los valores de las opciones son los del contrato. `tests/brief.spec.mjs` simula la función y revisa el JSON exacto, el agradecimiento, los casos 400, 429 y sin red, y el formulario sin JavaScript.

## Nuestro trabajo: apps propias y proyectos de clientes

Las tarjetas de "Nuestro trabajo" de la página de servicios salen de `workItems()` en `scripts/build.mjs`. Primero van las apps de la lista `apps`, cada una con su `work` en cada idioma (`shows`, `problem`, `built` y `ai`; `claim` es la frase de su tarjeta en el inicio), y después los proyectos de clientes de la lista `projects`, que hoy está vacía; un comentario en el código muestra cómo es una entrada. Cada tarjeta dice si es "Producto propio" o "Proyecto para cliente". Un proyecto de cliente se publica solo con su permiso.

## Cómo cambiar algo

Todo sale de `scripts/build.mjs`: los textos, los enlaces, el estado de las tiendas y los enlaces legales. Las páginas de `site/` no se editan a mano. El diseño está en `site/assets/style.css`.

```sh
node scripts/build.mjs          # vuelve a escribir las páginas en site/
node scripts/build.mjs --check  # falla si site/ no está al día, si hay un enlace roto,
                                # si una app no tiene su privacidad y sus términos,
                                # si alguna página enlaza a github.io,
                                # si hay en site/ una página que el build no escribe
                                # o si ya pasó LAUNCH_PRICE_UNTIL
```

Los precios de Resume Roast y Roast Interview están en `prices` de cada app y se muestran como precio de lanzamiento hasta `LAUNCH_PRICE_UNTIL` (hora de Bogotá). Para extenderlo se cambia solo esa fecha; si ya pasó, `--check` falla hasta que se extienda o se quite.

Cuando sale una versión nueva de Ojito se cambia `OJITO_VERSION` y, en los dos idiomas, la última pregunta frecuente de su página, que cuenta qué trae esa versión; el número también va en los datos estructurados (`softwareVersion`). Lo mismo vale para Resume Roast con `RESUME_ROAST_ANDROID_VERSION`, que es la versión publicada en Google Play: la app de iPhone todavía no es pública, así que su página habla de Android y sus datos estructurados dicen `operatingSystem: Android`. Si la versión cambia algo que el soporte o las políticas describen, se cambian también esos textos (ver [Páginas legales](#páginas-legales)).

Después se hace commit de `scripts/build.mjs` y de `site/` juntos. El flujo `.github/workflows/pages.yml` corre `--check` en cada PR y publica `site/` cuando entra a `main`.

Las páginas cargan `style.css` con un hash de su contenido en la dirección (`style.css?v=…`). Así un navegador que todavía tenga guardada una versión vieja de la hoja de estilos no la mezcla con páginas nuevas (eso dejó el sitio publicado sin estilos por un rato). Por eso, después de cambiar `style.css` también hay que correr `node scripts/build.mjs`; `--check` falla si no. Lo mismo vale para `brief.js` y `stack.js`, que se cargan como `brief.js?v=…` y `stack.js?v=…`.

Para verlo en el computador:

```sh
node scripts/serve.mjs   # y abrir http://127.0.0.1:4173
```

## Calidad

Las herramientas son solo para revisar; el sitio publicado sigue sin dependencias. Se instalan con `npm ci` y `npx playwright install webkit` (necesita Node 24 y Google Chrome) y corren en cada PR en el trabajo `quality` de `.github/workflows/pages.yml`. Si falla, no se publica.

| Comando | Qué revisa |
|---|---|
| `npm run lint` | HTML válido ([html-validate](https://html-validate.org)) y CSS ([stylelint](https://stylelint.io) con `stylelint-config-standard`) |
| `npm run test:ui` | Con [Playwright](https://playwright.dev) abre cada página del sitemap en un teléfono y en un computador, con el sistema en tema claro y oscuro: cero problemas de accesibilidad de [axe-core](https://github.com/dequelabs/axe-core) (WCAG 2.2 A y AA y buenas prácticas), sin scroll de lado, sin imágenes rotas, sin errores en consola, un solo `h1`, canonical y `og:url` en `https://tutosapp.co`. Revisa que Chrome lea completa la hoja de estilos (cuenta sus reglas y falla si lee bastante menos de las que tiene el archivo) y que cada página la cargue con el hash de su contenido; que el inicio muestre cada app con su frase, una pantalla, sus tiendas y el enlace a su página; que los botones del teléfono de cada app cambien lo que se ve; que las tarjetas de las apps del inicio y las de "Nuestro trabajo" de servicios se apilen al hacer scroll y solo se desplacen con "reducir movimiento", y que con "reducir movimiento" el inicio no tenga animaciones y muestre todo completo. Revisa el botón flotante del chat: aparece después de bajar un poco y nunca muestra un mensaje encima de la página, abre y cierra el panel con el teclado, Esc, su botón y un clic afuera, no deja salir el foco, devuelve el chat a su sección, se esconde en el contacto, nunca tapa un botón ni una tienda, no se cierra al soltar afuera un arrastre que empezó adentro, también está en la página 404, y si el panel se cierra mientras envía avisa junto al botón que la idea se envió o que no (y deja reintentar). Revisa el chat "Cuéntanos tu idea" con la función simulada: el JSON exacto del contrato, el agradecimiento, el correo y WhatsApp de respaldo ante un 400, un 429 o sin red, la validación de cada respuesta, que no envía nada sin autorización y el formulario sin JavaScript. En cada página revisa la lista de apps del menú: cerrada no muestra nombres; abierta tiene todas las apps y el inicio, marca la página actual, cabe en la pantalla, se cierra tocando afuera o con Esc, se maneja con el teclado y lleva a cada app (también en el iPhone). Deja capturas de página completa en `test-results/screens/`. En cada página legal revisa que tenga su título y su fecha, que la tabla de contenido lleve a cada sección, que el cambio de idioma lleve al mismo documento en el otro idioma, que el pie enlace los documentos de la app y que ningún enlace vaya a `github.io`; y que cada app enlace su privacidad y sus términos en este sitio. En un iPhone (WebKit, el motor de Safari) y en un Android (Chrome), revisa que cada página muestre su título y su botón principal en la primera pantalla, sin hacer scroll. Con el sitio de prueba de 4, 5, 6, 7 y 8 apps (`scripts/fixture.mjs`, en una carpeta temporal que se borra al terminar), revisa en teléfono y computador, y con 8 apps también en un computador de 1100 px de ancho, que el inicio muestre todas las apps en filas completas que se apilan fila por fila y las cuente, que cuando la última fila queda corta (5 y 7 apps, u 8 en filas de tres) las tarjetas no se apilen y la fila anterior no quede asomada a los lados, que el menú de apps las tenga todas y quepa en la pantalla, que el menú, servicios y el pie no se salgan de lado, que no haya problemas de accesibilidad, y que una app web y una que viene pronto tengan su página correcta; deja capturas en `test-results/screens/scaling-*.png` |
| `npm run lighthouse` | [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) en el inicio, la página de servicios y las páginas de las apps, en los dos idiomas, y en una página legal por app y la de la empresa (la lista sale de las apps, en `lighthouserc.cjs`): accesibilidad y SEO en 100, buenas prácticas en 95 o más, y aviso si el rendimiento baja de 90. Los informes quedan en `.lighthouseci/` |
| `npm run quality` | Todo lo anterior, más `node scripts/build.mjs --check` |

En GitHub, los informes y las capturas quedan como artefacto `quality-reports` de cada ejecución.

Las herramientas automáticas encuentran solo una parte de los problemas de accesibilidad. Antes de un cambio grande conviene probar con el teclado y con el lector de pantalla del teléfono.

### Cómo agregar una app

Una app nueva (una app móvil, una app web o una que todavía no sale) es **una entrada más** en la lista `apps` de `scripts/build.mjs`, más sus imágenes y sus dos textos legales. Con eso aparece sola en el inicio (su tarjeta, y los contadores de apps propias y ya disponibles), en el menú de apps, en "Nuestro trabajo" y en la tarjeta del proceso de servicios, en el pie, en el sitemap, en Lighthouse CI (`lighthouserc.cjs`) y en las pruebas, y tiene su propia página y sus páginas legales en los dos idiomas, con sus datos estructurados (`MobileApplication`, o `WebApplication` si solo está en la web). Nada más del sitio nombra las apps una por una.

Lo que hay que tener:

| Qué | Dónde va |
|---|---|
| Nombre | `name`, y un `id` corto en minúsculas (`mi-app`) que se usa en las direcciones y en las carpetas |
| Tagline (una línea: qué es) | `category` en cada idioma; también sale en el menú de apps |
| Frase de su tarjeta en el inicio | `work.claim` en cada idioma |
| Ícono de 256 × 256 (PNG o SVG) | `site/assets/img/<id>/icon.png`, en `icon` |
| 2 o 3 pantallas reales por idioma (hasta 8), sin marco: WebP de 600 px de ancho para un teléfono, o capturas anchas (por ejemplo 1280 × 800) para una app web | `site/assets/img/<id>/screens/`, en `screens` y su tamaño en `screenSize`; la primera es la del inicio |
| Dónde se consigue y su estado | `status` (`'live'`, `'test'` o `'soon'`) y `stores`: `play`, `appStore` y `web`, cada una `{ status: 'live', url }` o `{ status: 'soon' }`. Solo se muestran las que se ponen: una app web pone solo `web` (y `device: 'browser'` para mostrar sus pantallas en una ventana de navegador). Si ninguna está `'live'`, en cada idioma va `notify` (un enlace de correo para "Avísame") |
| Textos en español y en inglés (`es`, `en`) | `for`, `title` (hasta 70 caracteres con lo que le agrega la página), `description`, `headline` (con `*palabras*` en el color de acento), `lead`, `pitch`, `tabs` (una por pantalla: nombre, color del punto y descripción, que es el texto alternativo), 4 `benefits` (ícono de `glyphs`, título y texto), 3 `steps`, `faq`, `closing`, `share`, `navCta` y el resto de `work` (`shows`, `problem`, `built`, `ai`) |
| Rutas en cada idioma | `paths`, por ejemplo `{ es: 'mi-app/', en: 'mi-app/en/' }`; la primera es la de su idioma principal |
| Política de privacidad y términos | `legal/<id>/es-privacy.html`, `en-privacy.html`, `es-terms.html` y `en-terms.html` (ver [Páginas legales](#páginas-legales)), con su fecha en `legal`; soporte (`support`) es opcional |
| Datos para buscadores | `category` de la app (una `applicationCategory` de schema.org, como `'BusinessApplication'`) y `color` (su acento, también en el orbe) |

Opcional, con un valor por defecto tranquilo: `theme` (una clase de `style.css` con sus colores, como `.t-ojito`; sin ella usa los colores de Tutos App), `bg` y `light` (color del navegador en su página y en sus páginas legales), `fonts` (si usa otra fuente: va en `site/assets/fonts/` y su página la precarga), `decor`, `floats`, `ticker`, `shots` y `shotSize` (capturas de tienda para "Así se ve"; sin ellas se muestran sus pantallas), `feature` (la pantalla junto al primer beneficio; sin ella, la última), `prices`, `version` y `os`. El comentario sobre la lista `apps` explica cada campo, y la forma más corta de empezar es copiar una de las que hay.

Después:

```sh
npm run og                       # dibuja sus imágenes para redes (og/<id>-es.jpg y -en.jpg) si no las tiene,
                                 # y las del inicio y servicios, que llevan un ícono por app
node scripts/build.mjs           # escribe sus páginas en site/
node scripts/build.mjs --check   # dice qué falta: textos, imágenes, legales, tiendas, enlaces rotos
npm run lint && npm run test:ui  # HTML, CSS, accesibilidad y diseño en teléfono y computador
```

y se hace commit de `scripts/build.mjs`, `site/` y `legal/` juntos.

**Con más apps.** `node scripts/fixture.mjs <total> <carpeta>` hace, solo en local, una copia del sitio con apps falsas hasta llegar a `<total>` (una app web, una que viene pronto, una en una sola tienda, una app web que viene pronto y una en las dos tiendas), con las mismas revisiones de `--check`. `<carpeta>` se borra y se vuelve a escribir, así que debe ser nueva, estar vacía o ser una copia anterior de este script, y estar fuera del repositorio o dentro de `test-results/`; con cualquier otra el script se niega sin tocar nada. Se ve con `SITE_DIR=<carpeta>/site node scripts/serve.mjs`. Nunca se escribe en `site/` (el build se niega) ni se publica, y `--check` falla si en `site/` hay una página que el build no escribe. `tests/scaling.spec.mjs` la usa para revisar el sitio con 4, 5, 6, 7 y 8 apps (ver [Calidad](#calidad)).

### Cuando una app salga en una tienda

Se cambia su `status` a `'live'` y el de la tienda (`stores.play` o `stores.appStore`) a `'live'` con su `url`. El botón pasa de "Próximamente" a enlace. Hoy:

| App | Google Play | App Store |
|---|---|---|
| Ojito | Próximamente (en prueba cerrada; "Probarla en Android" pide entrar por correo) | Enlace a `id6832288734` |
| Resume Roast | Enlace a `com.resumeroast.app` | Próximamente |
| Roast Interview | Próximamente | Próximamente |

## Páginas legales

**Este repositorio es la única fuente de los textos legales** de las apps: la política de privacidad, los términos y el soporte de cada una se publican aquí, en `tutosapp.co`, y en ningún otro lugar. Los repositorios viejos en GitHub Pages (`ojito-legal`, `daily-quest-privacy-policy`, `castores-legal` y `resumeroast-support`) ya no son la fuente: si un texto cambia, se cambia aquí.

La política de privacidad de la empresa (`/privacidad/`, `/en/privacy/`), para lo que llega por el chat, el correo o WhatsApp, está en `legal/tutosapp/<idioma>-privacy.html` y usa el mismo diseño. Su fecha es `companyPrivacy.date` en `scripts/build.mjs`.

| App | Español | Inglés |
|---|---|---|
| Ojito | `/ojito/privacidad/`, `/ojito/terminos/`, `/ojito/soporte/` | `/ojito/en/privacy/`, `/ojito/en/terms/`, `/ojito/en/support/` |
| Resume Roast | `/resume-roast/es/privacidad/`, `/resume-roast/es/terminos/`, `/resume-roast/es/soporte/` | `/resume-roast/privacy/`, `/resume-roast/terms/`, `/resume-roast/support/` |
| Roast Interview | `/roast-interview/es/privacidad/`, `/roast-interview/es/terminos/` | `/roast-interview/privacy/`, `/roast-interview/terms/` |

Cada página va dentro de la carpeta de su app y su idioma (la misma regla de las páginas de las apps), con la dirección en el idioma de la página.

El texto de cada documento está en `legal/<app>/<idioma>-<documento>.html` (por ejemplo `legal/ojito/es-privacy.html`): empieza con su `<h1>` y sigue con el documento tal como se publica, con su versión y su fecha de vigencia. `scripts/build.mjs` lo pone en el diseño del sitio: una columna fácil de leer, una tabla de contenido hecha con sus secciones (`h2`) y la fecha de la última actualización. No cambia el texto: solo le pone un `id` a cada sección que no lo tenga, deja que el teclado llegue a una tabla ancha que se mueve de lado y mantiene los teléfonos en una sola línea. Los enlaces entre documentos se escriben `legal:<app>/<documento>/<idioma>` (con `#id` si hace falta) y el build los cambia por la dirección relativa. Donde un texto dice en qué tiendas está la app se escribe `{{stores}}`: el build pone la frase según `stores` de la app (por ejemplo "Disponible para Android en Google Play y próximamente para iPhone en el App Store."), así coincide con la página de la app y cambia sola cuando una tienda sale.

Para cambiar un texto legal:

1. Se edita su archivo en `legal/`, en los dos idiomas si el cambio aplica a los dos.
2. Se cambia la fecha de ese documento en `legal` de la app en `scripts/build.mjs` (`YYYY-MM-DD`); es la "Última actualización" que muestra la página.
3. Se corre `node scripts/build.mjs` y se hace commit de `legal/`, `scripts/build.mjs` y `site/` juntos.

Una app nueva necesita al menos `privacy` y `terms` (`--check` falla si no); `support` es opcional. Ninguna página del sitio puede enlazar a `github.io`: `--check` revisa todas las páginas y archivos de `site/` y falla si aparece una.

## Dominio

`tutosapp.co` está comprado en GoDaddy y configurado así:

- **GoDaddy (DNS):** registro `A` de `@` a `185.199.108.153` y `CNAME` de `www` a `msalcedo23.github.io`. GitHub recomienda agregar también los `A` a `185.199.109.153`, `185.199.110.153` y `185.199.111.153` para que el sitio no dependa de una sola dirección.
- **GitHub, Settings → Pages:** dominio personalizado `tutosapp.co` y "Enforce HTTPS" activado (el certificado de Let's Encrypt ya está emitido). Con publicación por GitHub Actions el dominio se guarda en GitHub, no en el archivo `CNAME`; el `CNAME` de `site/` queda como referencia.
- **Redirecciones:** GitHub manda `www.tutosapp.co`, `http://` y las direcciones viejas `https://msalcedo23.github.io/tutosapp-web/...` a la misma página en `https://tutosapp.co/...`, así que los enlaces que ya se compartieron siguen funcionando.

Para cambiar de dominio: se cambia `DOMAIN` en `scripts/build.mjs`, se corre `node scripts/build.mjs` y se cambia el dominio en Settings → Pages (o `gh api -X PUT repos/msalcedo23/tutosapp-web/pages -f cname=<dominio>`).

## Imágenes y fuentes

Las capturas de tienda salen de los repos de cada app (`docs/tienda/capturas` de Ojito, `docs/store/graphics/play/screenshots` de Resume Roast, `docs/screenshots` de Roast Interview iOS), reducidas a 960 px de alto. Las pantallas del teléfono son pantallas reales sin marco: `tools/capturas/pantallas` (y `pantallas/en`) de Ojito, `docs/store/source/raw/<idioma>` de Resume Roast Android y `docs/screenshots` de Roast Interview iOS, pasadas a WebP de 600 px de ancho (552 px las de iOS).

Las fuentes son Geist, Geist Mono (las etiquetas numeradas), Instrument Serif itálica (Ojito) y Anton (los titulares de Resume Roast), con licencia SIL Open Font License (`site/assets/fonts/OFL-*.txt`). Se sirven desde el mismo sitio, solo con los caracteres latinos.
