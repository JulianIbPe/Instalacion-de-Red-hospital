## Proyecto

- Al empezar cada sesión, leé `SEGUIMIENTO.md` (sección 0 primero) antes de trabajar. Los archivos ya están en esta carpeta: no hace falta pedir el `.zip` (paso 1 de la sección 0).
- **Una fase por vez, nunca sin permiso:** no des por terminada una fase ni empieces la siguiente sin que el usuario lo confirme explícitamente. Al terminar el trabajo de una fase, informá qué se hizo y qué falta probar, y esperá. Lo mismo antes de escribir código de una fase nueva: presentá el diseño y esperá confirmación.
- Al terminar cada avance, actualizá `SEGUIMIENTO.md` según su regla de mantenimiento.

## Skills

Elegí la skill según la tarea, sin esperar que el usuario la indique. Una sola skill por momento; las reglas de "Proyecto" mandan sobre cualquier skill.

- **Escribir código:** ponytail (siempre activo). Para preguntas sobre el código, graphify.
- **Fin de fase:** al informar que una fase está lista, recomendá correr `/thermos` antes de commitear o mergear (o `/thermo-nuclear-code-quality-review` si solo importa la arquitectura). Thermos solo lo puede lanzar el usuario. No corras otra revisión sobre el mismo diff (`code-review`, `ponytail-review`, `simplify`).
- **Hallazgos de thermos:** no los apliques solos; presentalos y que el usuario decida (thermos pide refactors grandes, ponytail el cambio mínimo).
- **Salud del repo entero:** sugerí `/ponytail-audit` cada tanto (thermos solo mira el diff).
- **Documentos:** `docx` / `pdf` / `xlsx` para archivos a entregar; `docs` para documentos a compartir y editar.
- **agent-skills:** deshabilitado a propósito en este proyecto (se superpone con thermos/ponytail y choca con la regla de fases). Si una tarea se beneficiaría de una de sus skills (interview-me, planning-and-task-breakdown, debugging-and-error-recovery, test-driven-development), sugerí habilitarlo temporalmente con `/plugin`; no lo habilites vos.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
