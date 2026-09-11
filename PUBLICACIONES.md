# Publicaciones con fecha y hora

En el prompt: «Publicar el 21/09/2026 a las 09:30, hora de España peninsular, en Consejos».

El contenido y la imagen se preparan y guardan con antelación en GitHub/main.
En content/posts/<slug>.json se añade `publish_at: "2026-09-21T09:30"` y
`published: true`. La zona predeterminada es Europe/Madrid; verano e invierno
se calculan automáticamente. Horas inexistentes o duplicadas durante cambios
de horario provocan error: en esos casos indicar +01:00 o +02:00 explícitamente.
`date` debe coincidir con el día de publicación; el generador usa el día de
publish_at en Madrid cuando existe. Mantener el slug aunque se reprograme.

Sin publish_at las entradas conservan su comportamiento inmediato.
Con published:false son borradores y nunca se activan automáticamente.
Para cancelar una publicación pendiente, poner published:false y guardar en main.
Para reprogramar, cambiar publish_at antes de su salida y guardar en main.

El generador omite entradas futuras de Inicio, Noticias, páginas individuales,
metadatos y sitemap. La publicación más reciente de cada categoría aparece en
Inicio; las anteriores permanecen en Noticias. No se modifica el diseño.
No es un mecanismo de confidencialidad: el repositorio y los archivos multimedia
pueden ser públicos antes de la fecha.

GitHub Actions comprueba cada cinco minutos las entradas listas y vencidas.
Solo si detecta una nueva fecha vencida actualiza content/publication-state.json
y crea un commit que activa el despliegue conectado de Netlify. No usa claves
personales ni necesita el ordenador. El registro no modifica los artículos.
Un despliegue normal también incluye cualquier entrada cuya fecha ya haya llegado.

La hora es un umbral, no una garantía de publicación al segundo: pueden añadirse
el intervalo de comprobación, colas de GitHub y el tiempo de Netlify. GitHub puede
desactivar schedules tras 60 días de inactividad en repositorios públicos; al
preparar cada publicación verificar que Actions está habilitado y que la última
ejecución y el despliegue de Netlify terminaron correctamente. Revisar también
créditos de hosting y políticas de rama. No se despliega cada cinco minutos.

Validación: `node --test scripts/publication-schedule.test.mjs`,
`node scripts/build.mjs`. Ejecución manual en GitHub Actions > Publicaciones
programadas > Run workflow. Un push concurrente que rechace el commit se
recupera en la siguiente comprobación (no se hace force push).

Google Business Profile tiene su propia programación. Este mecanismo solo
programa la web; no publica automáticamente en Google.
