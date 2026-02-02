# Feature Documentation Rule

## Scope

This rule applies whenever work is done on a **feature** (new capability, flow, or significant change), regardless of agent or tool.

## Mandatory Location

- All feature-related documentation **must** live under **`docs/dev/features/`**.
- Create **one directory per feature**, named by **slug** (kebab-case), e.g. `docs/dev/features/password-auth-flow/`, `docs/dev/features/oauth2-interactive-login/`.
- **Slug** — короткое имя фичи в kebab-case, по которому именуются директория и обязательные файлы (например, `runtime-settings-init`, `oauth2-interactive-login`).

## Required Files (obligatory)

В директории фичи **обязательно** создаются два файла с именами на основе slug:

1. **`[slug].plan.md`** — первоначальный план. Создать и сохранить **до или в начале** реализации. Использовать структуру из раздела «Plan document format» ниже. Пример: `password-auth-flow.plan.md`, `runtime-settings-init.plan.md`.

2. **`[slug].implementation.md`** — результат реализации. Содержит:
   - Что реализовано (кратко)
   - Основные созданные/изменённые файлы
   - Как это стыкуется с существующим кодом  
   Кратко и удобно для сканирования; достаточно для понимания результата людьми и агентами. Пример: `password-auth-flow.implementation.md`.

## Optional Files (only when necessary)

Дополнительные файлы в директории фичи — **на усмотрение ИИ-агента**, только если они действительно нужны для контекста, инструкций или описания (например, `README.md` как точка входа, чеклист проверки, краткая инструкция). **Не создавать лишние файлы**; по умолчанию достаточно плана и отчёта о реализации.

---

## Plan document format (mandatory for [slug].plan.md)

Файл плана **должен** следовать этой структуре. Сохранять как `docs/dev/features/<feature-slug>/<slug>.plan.md`.

```markdown
# [Название задачи]

---

**Status**: [Task feature status]
**Version**: [Current Doc version]
**Last Updated**: [Date Time]

---

## Task Overview

Краткое описание задачи (2-3 предложения). Что нужно сделать и зачем.

## Objectives

Конкретные, измеримые цели:
- Достичь X
- Создать Y
- Обеспечить Z

## Context

Важная справочная информация:
- **Current State**: текущее состояние проекта
- **Constraints**: ограничения (время, ресурсы, технологии)
- **Available Resources**: доступные инструменты и данные
- **Assumptions**: предположения и допущения

## Approach / Strategy

Общий подход к решению задачи. Высокоуровневая стратегия без детальных шагов.

## Implementation Steps

1. Первый шаг — конкретное действие с указанием инструментов
2. Второй шаг — следующее логическое действие
3. Третий шаг — продолжение последовательности
4. И так далее...

## Success Criteria

- [ ] Критерий 1: измеримый результат
- [ ] Критерий 2: условие завершения
- [ ] Критерий 3: качественный показатель

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Потенциальная проблема 1 | High/Medium/Low | Способ решения |
| Потенциальная проблема 2 | High/Medium/Low | Способ решения |

## Output / Deliverables

Что будет создано в результате:
- **Files**: список файлов с путями
- **Reports**: отчёты и документация
- **Artifacts**: другие артефакты

## Notes

Дополнительные заметки, комментарии или ссылки на ресурсы.
```

Sections may be shortened or marked "N/A" if not applicable; do not remove section headers. Keep content concise for token economy.

## Purpose

- **Context and history:** Anyone (human or agent) can see what was planned and what was done.
- **Token economy:** Small, focused docs reduce token use when agents load feature context.
- **Traceability:** Features are discoverable under one root (`docs/dev/features/<feature-slug>/`).

## Workflow

1. **Перед реализацией фичи:** убедиться, что существует директория `docs/dev/features/<feature-slug>/`; **создать и сохранить** файл плана **`<slug>.plan.md`** в формате выше. Этот шаг **обязателен**.
2. В процессе или после реализации: создать или обновить файл **`<slug>.implementation.md`**.
3. Не создавать отдельные документы на каждую подзадачу; всё консолидировать в план и отчёт о реализации.

## Priority

Правило применяется ко всем агентам при работе над фичами. Примеры структуры: директории в `docs/dev/features/` с обязательными файлами `<slug>.plan.md` и `<slug>.implementation.md` (например, `password-auth-flow`, `oauth2-interactive-login`, `runtime-settings-init`).
