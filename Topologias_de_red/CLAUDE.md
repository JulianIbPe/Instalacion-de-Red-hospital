## Proyecto

- Al empezar cada sesión, leé `SEGUIMIENTO.md` (sección 0 primero) antes de trabajar. Los archivos ya están en esta carpeta: no hace falta pedir el `.zip` (paso 1 de la sección 0).
- **Una fase por vez, nunca sin permiso:** no des por terminada una fase ni empieces la siguiente sin que el usuario lo confirme explícitamente. Al terminar el trabajo de una fase, informá qué se hizo y qué falta probar, y esperá. Lo mismo antes de escribir código de una fase nueva: presentá el diseño y esperá confirmación.
- Al terminar cada avance, actualizá `SEGUIMIENTO.md` según su regla de mantenimiento.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
