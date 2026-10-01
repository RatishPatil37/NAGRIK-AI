# 🏛️ The Three Abstraction Layers: Separating Church from State

To maintain clean architecture, predictable agent behavior, and prevent testing mocks or meta-process discussions from contaminating core application logic, all interactions and code implementations in Nagrik AI are partitioned into three distinct layers:

---

## 1. PS (Product-Solution) Layer
* **Definition**: The actual technical architecture, production algorithms, database schemas, API contracts, and user-facing features.
* **Scope**:
  - FastAPI endpoints, SSE streaming loops, Qdrant hybrid vector indexers.
  - Multi-tenant JWT authorization, rate limiters with TTL pruning.
  - React components, Ward Profile HUD, Command Palette (`Cmd+K`), Citation Hover Cards.
* **Rule**: PS code must NEVER hardcode mock citizen IDs, fake responses, or bypass authentication (except when strictly guarded under `settings.TESTING = True`).

---

## 2. PM (Project-Management) Layer
* **Definition**: The meta-process, engineering roadmap, task sequencing, git branching strategies, and documentation workflows.
* **Scope**:
  - Milestone plans, task dependencies, pull request conventions.
  - Architecture Decision Records (ADRs) and review logs.
* **Rule**: When the user asks for planning or task breakdown, do NOT jump directly into writing production code until the specification or plan artifact has been presented and aligned.

---

## 3. TA (Test-Article) Layer
* **Definition**: Synthetic dummy data, test fixtures, simulated citizen prompts, edge cases, and automated test runners.
* **Scope**:
  - `backend/tests/` fixtures, mock JWT payloads, dummy grievance inputs.
  - Corpus edge cases (corrupted PDFs, prompt injection tests, OOM memory stress tests).
* **Rule**: TA fixtures must remain strictly isolated within `tests/` or `data/fixtures/`. They must NEVER leak into runtime seed scripts, database migrations, or production business logic.

---

## 4. Targeted Learning Protocol (`/learn` and `/workflow-skill-creator`)
When updating agent skills or workspace rules via slash commands:
1. **Meta-Habits**: General engineering conventions (e.g., commit formats, communication style, sub-second TTFT invariants) belong in `.agents/rules/CODE_STANDARDS.md` or global configurations.
2. **Domain-Specific Knowledge**: Municipal bylaws, tax calculation formulas, department SLA matrices, and ward schemas belong strictly in `.agents/skills/` and `docs/adr/`.
*Never promote a temporary project-specific hack into a global meta-habit.*
