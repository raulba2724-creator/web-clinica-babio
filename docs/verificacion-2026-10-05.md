# Mejoras de clinicababio.es — 5 de octubre de 2026

## Estado de entrega

Implementación local terminada sobre una copia limpia de `main`, base `54c97d9fbbc21907c7ef80f2eef98cd181408c68`. No se han sobrescrito cambios ajenos ni modificado el repositorio original fuera del área de trabajo permitida.

**Publicado.** El usuario subió el commit `d740f870986285b88576590ceb7ca6c739835008` a `main`. El 5 de octubre de 2026 se verificaron en el navegador público la portada nueva, implantes fracasados, Privacidad, perfil y artículo de cuidados, además de la resolución del alias de implantes hacia `.html`. No se ha consultado el registro interno de despliegue de Netlify.

## Cambios implementados

- `/`: introducción y botones simplificados; historia familiar concentrada en Conócenos; enlaces a tratamientos completos y rehabilitación; explicación de altura de mordida y perfil de emergencia; retirada de cifras históricas sin respaldo documental localizado.
- `/implantes-fracasados-sevilla.html`, `/implantes-carga-inmediata-sevilla.html`, `/implantes-sector-estetico-sevilla.html`: contenido específico, fases, límites, preguntas frecuentes, conservación de dientes viables, fuentes EFP/SEPA/ITI y enlaces relacionados. Eliminada la instrucción interna detectada. Dirección profesional enlazada sin inventar autoría ni revisión clínica.
- `/dr-raul-babio-arjona.html`: redacción natural del perfil contrastada con el CV; colaboración docente conforme a la ficha oficial de la Universidad de Sevilla, edición 2025–2026; separación del fundador y el director. Se conserva la incorporación en 2018 y se expresa la dirección actual sin inventar una fecha de inicio diferente.
- `/privacidad.html`, `/contacto.html`, `/aviso-legal.html`: correo coherente y eliminación de rótulos provisionales. Corrección editorial, no auditoría jurídica.
- Artículos: correcciones puntuales en cuidados de implantes, complementos de higiene, tabaco, encías y corazón, zirconio, ortodoncia y efecto septiembre. Se conservan URLs, fechas de publicación y autorías; se actualiza la fecha de modificación cuando hay edición real.
- Estilos y navegación: superficies claras, texto más oscuro, marca de agua atenuada, controles accesibles de carrusel, pausa manual y preferencia de movimiento reducido, contenido visible durante animaciones, botón de configuración de analítica sin superposición fija.
- Imágenes: derivados WebP y tamaños limitados, dimensiones declaradas, carga diferida inferior y carga de diapositivas secundarias al mostrarlas. Las fotografías originales se conservan. Vídeo con `preload="none"`.
- Compilación: lista explícita de archivos publicables para impedir que documentación de trabajo acabe en `dist`. Conservados CMS, programación de artículos y bloque de tres últimas publicaciones.
- Sitemap: conserva 24 URLs públicas canónicas, incorpora fechas reales de edición. Robots ya lo referencia y las redirecciones exactas a `.html` ya estaban implementadas; se preservan.

## Comprobaciones

- Cuatro pruebas de publicación/programación: correctas.
- Compilación: correcta; 15 artículos visibles.
- Auditoría local: 27 páginas públicas, 24 bloques JSON-LD; enlaces y recursos internos, anclas, H1, canónicas propias, dimensiones de imágenes y sitemap XML sin incidencias.
- Revisión de coincidencias editoriales en contenido, metadatos y marcado: sin las instrucciones internas ni campos provisionales señalados. Las coincidencias restantes con «pendiente» se refieren a tratamientos o revisiones del paciente.
- Portada, implantes fracasados y artículo de cuidados: comprobados a 360, 390, 768 y 1440 px sin desbordamiento horizontal. Simulación local de texto al 200 % a 390 px: corregidos títulos largos; sin desbordamiento de página.
- Inspección visual de escritorio/móvil; menú, reapertura y rechazo del consentimiento, enlaces de teléfono/WhatsApp, selección y pausa de diapositivas comprobados. Sin errores de JavaScript registrados en las páginas revisadas.
- Contraste calculado sobre colores efectivos de texto y superficies opacas, incluidos extremos del degradado de botones: mínimo 6,12:1 entre 152 elementos de portada; 7,66:1 entre 59 elementos de implantes fracasados. No equivale a una certificación de accesibilidad de toda la web.
- Movimiento reducido implementado en CSS y en el carrusel; falta probar la preferencia activada en un dispositivo real, no disponible en los controles de esta sesión.
- Schema.org Validator: muestras del HTML local de portada, perfil, tratamiento y artículo, 0 errores y 0 advertencias. Identificadores de clínica/persona conservados. La validez del marcado no garantiza resultados enriquecidos.
- Google Maps: ficha, teléfonos y fragmentos de testimonios contrastados; 5,0/62 reseñas el 5 de octubre. Corregida la composición del testimonio de Mar y acortado el de María al fragmento verificable; se eliminan antigüedades de reseñas no comprobables.

## Rendimiento de producción anterior a estos cambios

Datos de laboratorio de PageSpeed Insights, 5 de octubre de 2026. **No son mediciones de la implementación local ni demuestran su mejora.**

| Página | Móvil | Escritorio | LCP móvil | LCP escritorio |
|---|---:|---:|---:|---:|
| Portada | 70 | 93 | 7,4 s | 1,4 s |
| Implantes fracasados | 82 | 99 | 3,8 s | 0,8 s |
| Cómo cuidar implantes | 70 | 91 | 10,7 s | 1,9 s |

TBT 0 ms en las seis mediciones. No hay datos reales de usuarios (CrUX) disponibles en los informes. La primera ejecución móvil del tratamiento falló; la repetición sí completó el informe.

- Portada: https://pagespeed.web.dev/analysis/https-clinicababio-es/qmn0b36mfy
- Tratamiento: https://pagespeed.web.dev/analysis/https-clinicababio-es-implantes-fracasados-sevilla-html/lfx5fmpr5e
- Artículo: https://pagespeed.web.dev/analysis/https-clinicababio-es-noticias-como-cuidar-implantes-dentales/z4tszo38on

La medición detectó imágenes excesivas y recursos que bloqueaban el renderizado. Los derivados generados suman aproximadamente 3,25 MB frente a 38,15 MB de los originales procesados en el conjunto del sitio; esto no es el peso de una página ni una puntuación Lighthouse nueva. Las fuentes externas aún deben reevaluarse después de publicar.

## Bloqueos y pendientes

1. Publicación y seis mediciones públicas realizadas. Persisten oportunidades de rendimiento en fuentes/CSS bloqueantes y tamaño de imágenes. La puntuación SEO de Lighthouse es 92: señala un enlace genérico. Esto no es una medida de posicionamiento.
2. Search Console: la cuenta abierta no muestra propiedades accesibles. No se ha podido comprobar el estado actual de indexación, otros envíos, acciones manuales o seguridad; tampoco enviar sitemap ni solicitar indexación. No se concluye que nunca se haya enviado. No se utiliza Indexing API.
3. Las herramientas de navegación bloquearon la apertura directa de `robots.txt` y `sitemap.xml` en producción (`ERR_BLOCKED_BY_CLIENT`); la red de terminal tampoco está disponible. La validación local no sustituye comprobar HTTP, cabeceras X-Robots-Tag y redirecciones 301 en el servidor público. La configuración local mantiene `noindex` solo para el administrador y alias exactos sin cadenas previstas.
4. Horario discrepante: web/documentación, lunes-martes 09–16 y viernes 09–13; ficha de Google, lunes-martes 09–17 y viernes 09–13:30. Miércoles-jueves 12–20 coinciden. Se conserva el horario documentado en la web, pendiente de confirmación de la clínica. No se edita Google Business Profile.
5. La colaboración en Aljamar se apoya en el CV disponible (desde 2022–actualidad); su continuidad al día de publicación necesita confirmación directa si el CV no está actualizado. No se ha encontrado una fecha diferenciada y acreditada de inicio de la dirección.

No se atribuye una revisión clínica real a la revisión editorial realizada ni se afirma una mejora de posicionamiento.


## Verificación pública posterior a la publicación

PageSpeed Insights, 5/10/2026 a las 15:37 CEST (laboratorio):

| Página | Móvil | Escritorio | LCP móvil | LCP escritorio |
|---|---:|---:|---:|---:|
| Portada | 76 | 98 | 4,6 s | 1,0 s |
| Implantes fracasados | 92 | 99 | 2,7 s | 0,7 s |
| Cuidados de implantes | 90 | 100 | 2,7 s | 0,7 s |

Accesibilidad automatizada 100 y TBT 0 en las seis mediciones. Sin datos CrUX. Las diferencias respecto a la línea base son resultados de laboratorio y pueden variar; no prueban una mejora de posicionamiento.

- https://pagespeed.web.dev/analysis/https-clinicababio-es/fz31hphtdb
- https://pagespeed.web.dev/analysis/https-clinicababio-es-implantes-fracasados-sevilla-html/twlsgwj4b3
- https://pagespeed.web.dev/analysis/https-clinicababio-es-noticias-como-cuidar-implantes-dentales/gy9pmudl0a

Se corrigen además cuatro referencias a 35 años en la página general de implantes, sin respaldo documental localizado. Cambios exclusivamente editoriales; estructura, URLs y marcado conservados.
