---
name: Test Coverage Implementation
overview: "Реализация недостающих тестов для достижения целевых показателей покрытия в соответствии с рекомендациями: unit тесты 61.69% → 85% statements, 51.99% → 75% branches; integration тесты 65.23% → 70% statements, 56.29% → 60% branches. Приоритет на качество тестов (бизнес-логика, негативные сценарии) над количеством покрытия. Coverage используется как защитный механизм от регрессий."
todos:
  - id: phase1-svg-fingerprinter
    content: "Расширить tests/unit/svg-fingerprinter.test.ts: добавить тесты для CSS анимаций (использовать getComputedStyle через jsdom-extended), edge cases всех типов фигур, обработки ошибок getComputedStyle, нормализации путей"
    status: completed
  - id: phase1-constraints-evaluator
    content: "Расширить tests/unit/constraints-evaluator.test.ts: добавить тесты для больших строк Levenshtein, edge cases getBoundingClientRect (использовать фиксированные значения из jsdom-extended), всех стратегий position, обработки whitespace"
    status: completed
  - id: phase2-fallback-handler
    content: "Расширить tests/unit/fallback-handler.test.ts: добавить тесты для обработки ошибок селектора, всех весов scoring, нормализации score, edge cases пустых semantics"
    status: completed
  - id: phase2-semantics-matcher
    content: "Расширить tests/unit/semantics-matcher.test.ts: добавить тесты для всех типов SVG фигур, обработки отсутствующих атрибутов, edge cases хеширования, null/undefined textContent"
    status: completed
  - id: phase2-batch-generator
    content: "Расширить tests/integration/batch-generator.test.ts: добавить тесты для обработки ошибок, skipNonSemantic логики, сортировки по приоритету, progressInterval, AbortSignal, cacheHitRate"
    status: completed
  - id: phase3-validator
    content: "Расширить tests/unit/validator.test.ts: добавить тесты для всех типов ошибок/предупреждений, edge cases isEID, TypeScript narrowing, валидации вложенных структур"
    status: completed
  - id: phase3-scorer
    content: "Расширить tests/unit/scorer.test.ts: добавить тесты для всех весов confidence, расчета среднего path score, degradation penalty, clamp граничных случаев"
    status: completed
  - id: phase3-resolver
    content: "Расширить tests/unit/resolver.test.ts: добавить тесты для всех 5 фаз резолвера, обработки ошибок в каждой фазе, всех опций ResolverOptions, degradation confidence"
    status: completed
  - id: phase3-path-builder
    content: "Расширить tests/unit/path-builder.test.ts: добавить тесты для всех semantic tags, фильтрации utility classes, алгоритма uniqueness, обработки ошибок querySelectorAll, кеширования"
    status: completed
  - id: phase4-constraints-integration
    content: "Создать tests/integration/constraints-evaluation.test.ts: end-to-end text proximity, position constraints, интеграция с resolver, реальные сценарии"
    status: completed
  - id: phase4-svg-integration
    content: "Создать tests/integration/svg-elements.test.ts: генерация и разрешение SVG, реальные библиотеки иконок, сложные структуры"
    status: completed
  - id: phase4-validation-integration
    content: "Создать tests/integration/validation.test.ts: end-to-end валидация, обнаружение ошибок, использование type guard"
    status: completed
  - id: phase4-expand-resolver-integration
    content: "Расширить tests/integration/resolver.test.ts: fallback сценарии, производительность, DOM вариации, устойчивость, сложные структуры"
    status: completed
  - id: phase4-expand-batch-integration
    content: "Расширить tests/integration/batch-generator.test.ts: масштаб, память, устойчивость, AbortSignal"
    status: completed
  - id: update-coverage-thresholds
    content: "Обновить vitest.config.unit.ts и vitest.config.integration.ts: установить пороги в рекомендуемых диапазонах (unit: 85% statements, 75% branches; integration: 70% statements, 60% branches), настроить исключения для index.ts, types, конфигураций"
    status: completed
  - id: final-verification
    content: "Запустить yarn test:coverage и проверить достижение целевых показателей: unit ≥85% statements, ≥75% branches; integration ≥70% statements, ≥60% branches; core алгоритмы ≥85-90%; проверить качество тестов (бизнес-логика, негативные сценарии, устойчивость к рефакторингу)"
    status: completed
isProject: false
---

# План реализации тестового покрытия

## Принципы тестирования

### Общие принципы

**Coverage как защитный механизм, а не KPI:**

- Coverage используется для защиты от регрессий, а не как метрика качества
- Запрещено писать тесты исключительно ради увеличения процента покрытия
- Приоритет — качество ассёртов, негативные кейсы и проверка бизнес-логики

**Исключения из покрытия:**

- Допускается и рекомендуется исключать из покрытия:
  - `index.ts` файлы (re-export)
  - Типы и интерфейсы (TypeScript type definitions)
  - Bootstrap и конфигурации
  - Сгенерированный код

**Качество над количеством:**

- Unit-тесты должны покрывать чистую логику и ломаться при изменении поведения, а не при рефакторинге структуры
- Поощряются property-based тесты и негативные сценарии
- Оценка тестов должна учитывать смысл проверок, а не только процент покрытия

### Пороговые значения покрытия

**Unit тесты (рекомендуемые пороги):**

- Lines / Statements: **80–90%**
- Branches: **70–85%**
- Functions: **80–90%**
- Для core-алгоритмов, парсеров, DSL, AST и селекторов допустимы пороги **выше 90%**
- Не требуется стремиться к 100% покрытию

**Integration тесты (рекомендуемые пороги):**

- Lines / Statements: **60–75%**
- Branches: **50–65%**
- Низкое покрытие по сравнению с unit-тестами считается нормальным
- Запрещено повышать coverage интеграционными тестами за счёт хрупких и медленных сценариев

**Глобальное покрытие по проекту:**

- Lines / Statements: **70–80%**
- Branches: **60–70%**
- Глобальный порог не должен блокировать рефакторинг и развитие архитектуры

**Стратегия порогов:**

- Пороги задаются по слоям или директориям, а не только глобально
- Core и критическая логика имеют более строгие требования
- Периферийный код — более мягкие требования или исключается из покрытия
- Coverage используется как guardrail, а не как цель

## Текущее состояние

### Существующие тесты

Многие тесты уже существуют, но имеют низкое покрытие из-за недостаточного покрытия веток и edge cases:

- `svg-fingerprinter.test.ts` - существует, но покрытие 0% (возможно, не запускается или не покрывает все ветки)
- `constraints-evaluator.test.ts` - существует, но покрытие 0%
- `fallback-handler.test.ts` - существует, покрытие 16.12%
- `semantics-matcher.test.ts` - существует, покрытие 24%
- `batch-generator.test.ts` - существует, покрытие 5.35%
- `validator.test.ts` - существует, покрытие 54.34%
- `scorer.test.ts` - существует, покрытие 50%
- `resolver.test.ts` - существует, покрытие 45.71%
- `path-builder.test.ts` - существует, покрытие 52.38%

## Стратегия реализации

### Приоритеты при написании тестов

**Качество над количеством:**

1. **Бизнес-логика:** Тесты должны проверять реальное поведение системы, а не просто покрывать строки кода
2. **Негативные сценарии:** Приоритет на тестирование ошибок, edge cases, граничных условий
3. **Устойчивость:** Тесты должны ломаться при изменении поведения, а не при рефакторинге структуры
4. **Осмысленность:** Каждый тест должен иметь четкую цель и проверять конкретный сценарий

**Запрещено:**

- Писать тесты исключительно для увеличения процента покрытия
- Дублировать unit-тесты в интеграционных тестах
- Писать хрупкие тесты, которые ломаются при рефакторинге без изменения поведения

**Рекомендуется:**

- Использовать property-based тесты для алгоритмов
- Тестировать негативные сценарии и обработку ошибок
- Фокусироваться на core алгоритмах (≥85-90% покрытие)

### Фаза 1: Модули с нулевым покрытием (Приоритет 1)

#### 1. Расширить `tests/unit/svg-fingerprinter.test.ts`

**Текущее состояние:** Тесты существуют, но покрытие 0%. Нужно добавить тесты для непокрытых веток.

**Важно:** Это core алгоритм хеширования - целевое покрытие **≥90%**.

**Дополнительные тесты (фокус на бизнес-логику):**

- CSS анимации и transitions (использовать getComputedStyle через jsdom-extended - уже работает)
- Обработка ошибок getComputedStyle (try-catch блоки) - **негативный сценарий**
- Edge cases для всех типов фигур (polyline, text, use, svg) - **граничные условия**
- Проверка нормализации чисел в путях (разные форматы) - **бизнес-логика**
- Проверка хеширования для edge cases (нулевые/отрицательные значения) - **граничные условия**
- Проверка консистентности хешей (одинаковые входные данные → одинаковый хеш) - **property-based тест**

**Критические файлы:**

- [src/generator/svg-fingerprinter.ts](src/generator/svg-fingerprinter.ts)

#### 2. Расширить `tests/unit/constraints-evaluator.test.ts`

**Текущее состояние:** Тесты существуют, но покрытие 0%. Нужно добавить тесты для непокрытых веток.

**Важно:** Это core алгоритм Levenshtein - целевое покрытие **≥90%**.

**Дополнительные тесты (фокус на алгоритм и edge cases):**

- Проверка оптимизации Levenshtein (single-row) с большими строками - **бизнес-логика алгоритма**
- Проверка корректности Levenshtein для известных пар (kitten→sitting=3) - **property-based тест**
- Edge cases для getBoundingClientRect (использовать фиксированные значения из jsdom-extended, проверить обработку ошибок) - **негативный сценарий**
- Проверка всех стратегий position (включая неизвестные) - использовать getBoundingClientRect без дополнительных моков
- Проверка обработки whitespace в тексте - **граничные условия**
- Проверка нормализации текста перед сравнением - **бизнес-логика**
- Проверка пустых строк и null значений - **негативные сценарии**

**Критические файлы:**

- [src/resolver/constraints-evaluator.ts](src/resolver/constraints-evaluator.ts)

### Фаза 2: Модули с низким покрытием (Приоритет 2)

#### 3. Расширить `tests/unit/fallback-handler.test.ts`

**Текущее состояние:** Покрытие 16.12%. Нужно добавить тесты для непокрытых веток.

**Дополнительные тесты:**

- Обработка ошибок при построении селектора якоря
- Проверка всех весов scoring (ID 0.3, class 0.25, attribute 0.2, role 0.15, text exact 0.1, partial 0.05)
- Проверка нормализации score (maxScore > 0)
- Edge cases для пустых semantics
- Проверка обработки Element vs Document в handleFallback

**Критические файлы:**

- [src/resolver/fallback-handler.ts](src/resolver/fallback-handler.ts)

#### 4. Расширить `tests/unit/semantics-matcher.test.ts`

**Текущее состояние:** Покрытие 24%. Нужно добавить тесты для непокрытых веток.

**Дополнительные тесты:**

- Проверка всех типов SVG фигур (polyline, text, use, svg, g)
- Проверка обработки отсутствующих атрибутов в SVG
- Проверка edge cases для хеширования (пустые строки, специальные символы)
- Проверка обработки null/undefined в textContent
- Проверка обработки элементов без classList

**Критические файлы:**

- [src/resolver/semantics-matcher.ts](src/resolver/semantics-matcher.ts)

#### 5. Расширить `tests/integration/batch-generator.test.ts`

**Текущее состояние:** Покрытие 5.35%. Нужно добавить тесты для всех функций.

**Дополнительные тесты:**

- Проверка обработки ошибок при генерации (try-catch блоки)
- Проверка skipNonSemantic логики для всех приоритетов
- Проверка сортировки по приоритету (HIGH, MEDIUM, LOW)
- Проверка progressInterval логики (вызовы через интервал)
- Проверка обработки AbortSignal (отмена в середине обработки)
- Проверка расчета cacheHitRate (разные сценарии)
- Проверка обработки пустого root
- Проверка обработки невалидного CSS селектора

**Критические файлы:**

- [src/utils/batch-generator.ts](src/utils/batch-generator.ts)

### Фаза 3: Основные модули (Приоритет 3)

#### 6. Расширить `tests/unit/validator.test.ts`

**Текущее состояние:** Покрытие 54.34%. Нужно добавить тесты для непокрытых веток.

**Дополнительные тесты:**

- Проверка всех типов ошибок валидации
- Проверка всех типов предупреждений
- Проверка edge cases для isEID (null в объектах, специальные значения)
- Проверка TypeScript narrowing для isEID
- Проверка валидации вложенных структур

**Критические файлы:**

- [src/utils/validator.ts](src/utils/validator.ts)

#### 7. Расширить `tests/unit/scorer.test.ts`

**Текущее состояние:** Покрытие 50%. Нужно добавить тесты для непокрытых веток.

**Дополнительные тесты:**

- Проверка всех весов confidence (ANCHOR 0.4, PATH 0.3, TARGET 0.2, UNIQUENESS 0.1)
- Проверка расчета среднего path score
- Проверка degradation penalty (-0.2)
- Проверка clamp [0, 1] для всех граничных случаев
- Проверка edge cases (все нули, все единицы)

**Критические файлы:**

- [src/utils/scorer.ts](src/utils/scorer.ts)

#### 8. Расширить `tests/unit/resolver.test.ts`

**Текущее состояние:** Покрытие 45.71%. Нужно добавить тесты для всех фаз резолвера.

**Важно:** Это core 5-фазный алгоритм резолвера - целевое покрытие **≥85%**.

**Дополнительные тесты (фокус на алгоритм и взаимодействие фаз):**

- Проверка всех 5 фаз резолвера по отдельности - **бизнес-логика алгоритма**
- Проверка обработки ошибок в каждой фазе - **негативные сценарии**
- Проверка всех опций ResolverOptions - **конфигурация**
- Проверка degradation confidence для всех сценариев - **бизнес-логика**
- Проверка обработки пустых constraints - **граничные условия**
- Проверка обработки constraints с одинаковым приоритетом - **edge case**
- Проверка последовательности фаз (Phase 1 → 2 → 3 → 4 → 5) - **интеграция фаз**

**Критические файлы:**

- [src/resolver/resolver.ts](src/resolver/resolver.ts)

#### 9. Расширить `tests/unit/path-builder.test.ts`

**Текущее состояние:** Покрытие 52.38%. Нужно добавить тесты для непокрытых веток.

**Важно:** Это core алгоритм построения пути - целевое покрытие **≥85%**.

**Дополнительные тесты (фокус на алгоритм построения пути):**

- Проверка всех типов semantic tags - **бизнес-логика фильтрации**
- Проверка фильтрации utility classes - **бизнес-логика фильтрации**
- Проверка алгоритма uniqueness (все ветки) - **core алгоритм**
- Проверка обработки ошибок querySelectorAll - **негативный сценарий**
- Проверка кеширования (все сценарии) - **оптимизация**
- Проверка edge cases (пустой path, отсутствующий parent) - **граничные условия**
- Проверка корректности построения пути для различных DOM структур - **property-based тест**

**Критические файлы:**

- [src/generator/path-builder.ts](src/generator/path-builder.ts)

### Фаза 4: Интеграционные тесты (Приоритет 4)

#### 10. Создать `tests/integration/constraints-evaluation.test.ts`

**Новый файл** для end-to-end тестирования constraints evaluator.

**Тесты:**

- End-to-end text proximity (разрешение похожих кнопок, отклонение очень разных, выбор ближайшей)
- End-to-end position (верхняя карточка, левый элемент, first-in-dom fallback)
- Интеграция с resolver (применение в Phase 4, сортировка по приоритету, остановка при уникальности)
- Реальные сценарии (различение Submit кнопок, карточки продуктов, перекрывающиеся модальные окна)

**Целевые файлы:**

- [src/resolver/constraints-evaluator.ts](src/resolver/constraints-evaluator.ts) - 0% → 65%+
- [src/resolver/resolver.ts](src/resolver/resolver.ts) - интеграционное тестирование

#### 11. Создать `tests/integration/svg-elements.test.ts`

**Новый файл** для end-to-end тестирования SVG элементов.

**Тесты:**

- Генерация и разрешение (round-trip для path/rect/animated/nested SVGs)
- Реальные библиотеки иконок (Lucide icons, Font Awesome SVG, Material Design Icons)
- Сложные структуры (различение похожих иконок, множественные пути, разные контексты)

**Целевые файлы:**

- [src/generator/svg-fingerprinter.ts](src/generator/svg-fingerprinter.ts) - интеграционное покрытие
- [src/resolver/semantics-matcher.ts](src/resolver/semantics-matcher.ts) - SVG matching

#### 12. Создать `tests/integration/validation.test.ts`

**Новый файл** для end-to-end тестирования валидации.

**Тесты:**

- End-to-end валидация (валидация сгенерированных EIDs, обнаружение некорректных внешних, JSON round-trip)
- Обнаружение ошибок (отсутствующие поля, устаревшие функции, сбор ошибок/предупреждений)
- Использование type guard (runtime проверки, TypeScript narrowing)

**Целевые файлы:**

- [src/utils/validator.ts](src/utils/validator.ts) - 0% → 65%+

#### 13. Расширить существующие интеграционные тесты

**`tests/integration/resolver.test.ts`** - Добавить 10-12 тестов:

- Fallback сценарии (якорь когда target удален, best-score для множественных)
- Производительность (100+ кандидатов)
- DOM вариации (SPA-style, server-rendered, Shadow DOM)
- Устойчивость (изменения CSS классов, изменения текста)
- Сложные структуры (вложенные формы, таблицы)

**`tests/integration/batch-generator.test.ts`** - Добавить 8-10 тестов:

- Масштаб (1000+ элементов, 50+ уровней вложенности)
- Память (нет утечек, опция clear cache)
- Устойчивость (мутации DOM в середине batch, частичные ошибки)
- Signal (корректность AbortSignal, точный progress)

## Обновление конфигурации

### Обновить пороговые значения покрытия

**`vitest.config.unit.ts`:**

```typescript
thresholds: {
  statements: 85,  // В диапазоне 80-90% (рекомендуемый)
  branches: 75,    // В диапазоне 70-85% (увеличить с текущего, но не выше 85%)
  functions: 80,   // В диапазоне 80-90%
  lines: 85,       // В диапазоне 80-90%
}
```

**`vitest.config.integration.ts`:**

```typescript
thresholds: {
  statements: 70,  // В диапазоне 60-75% (рекомендуемый)
  branches: 60,    // В диапазоне 50-65% (увеличить с текущего, но не выше 65%)
  functions: 65,   // В диапазоне 50-65%
  lines: 70,       // В диапазоне 60-75%
}
```

**Обоснование:**

- Пороги установлены в соответствии с рекомендациями для каждого типа тестов
- Branch coverage критичен для условной логики в resolver/generator pipelines
- Текущее branch coverage (51.99% unit, 56.29% integration) ниже рекомендуемых порогов, что указывает на непротестированные edge cases
- Пороги служат защитным механизмом, а не целью для достижения любой ценой

### Исключения из покрытия

Настроить исключения для файлов, которые не должны учитываться в coverage:

```typescript
coverage: {
  exclude: [
    '**/index.ts',           // Re-export файлы
    '**/*.d.ts',            // TypeScript type definitions
    '**/types/**',          // Типы и интерфейсы
    '**/constants.ts',      // Константы (если не содержат логику)
    'vitest.setup.ts',      // Bootstrap файлы
    'vitest.config*.ts',    // Конфигурации
  ],
}
```

## Использование jsdom-extended для моков

### Текущее состояние

Библиотека `@whenessel/jsdom-extended` уже установлена и настроена:

- Установлена в `package.json` (версия ^0.1.2)
- Применена в `vitest.setup.ts` через `applyJsdomExtended(window)`

### Возможности библиотеки

Библиотека предоставляет следующие моки для jsdom окружения:

**✅ Geometry mocks:**

- `getBoundingClientRect()` возвращает фиксированные размеры (100x50)
- Размеры окна установлены (1280x720)

**✅ RequestAnimationFrame (RAF):**

- Polyfill с поддержкой `cancelAnimationFrame`
- Симуляция ~60fps через `setTimeout`

**✅ ResizeObserver:**

- Минимальный мок, который сразу триггерит с фиксированным `contentRect`

**✅ TypeScript support:**

- Полная поддержка TypeScript с типами

**✅ Vite-ready:**

- Оптимизирована для современных build pipelines

### Использование в тестах

**Важно:** Все моки уже применены глобально через `vitest.setup.ts`, поэтому в тестах можно напрямую использовать:

```typescript
// getBoundingClientRect уже работает с фиксированными значениями
const rect = element.getBoundingClientRect();
expect(rect.width).toBe(100);
expect(rect.height).toBe(50);

// window размеры доступны
expect(window.innerWidth).toBe(1280);
expect(window.innerHeight).toBe(720);

// requestAnimationFrame работает
requestAnimationFrame(() => {
  // callback выполнится
});
```

### Особенности для тестирования

1. **getBoundingClientRect:** Не нужно мокать вручную - библиотека уже предоставляет фиксированные значения
2. **CSS анимации:** Для тестирования SVG анимаций можно использовать `getComputedStyle`, который работает благодаря библиотеке
3. **Position constraints:** Тесты для `top-most`, `left-most` могут использовать фиксированные значения из `getBoundingClientRect`
4. **ResizeObserver:** Доступен для тестирования responsive поведения

### Обновление тестов

При написании тестов для:

- **constraints-evaluator.ts:** Использовать `getBoundingClientRect()` без дополнительных моков
- **svg-fingerprinter.ts:** Использовать `getComputedStyle()` для проверки CSS анимаций
- **path-builder.ts:** Использовать фиксированные размеры для тестирования position-based логики

## Использование реальных данных

Для интеграционных тестов использовать HTML из `fixtures/modern-seaside-stay.htm` для создания реалистичных DOM структур.

## Порядок выполнения

1. **Настройка исключений:** Настроить исключения из coverage для `index.ts`, типов, конфигураций
2. **Baseline coverage:** Запустить `yarn test:unit:coverage && yarn test:integration:coverage` для получения текущих метрик
3. **Реализовать Фазу 1:** Расширить тесты с 0% покрытием (приоритет на бизнес-логику и edge cases)
4. **Реализовать Фазу 2:** Расширить тесты с низким покрытием (фокус на негативные сценарии)
5. **Реализовать Фазу 3:** Расширить основные модули (особое внимание к core алгоритмам - ≥85-90%)
6. **Реализовать Фазу 4:** Создать новые интеграционные тесты (проверка взаимодействия модулей, не дублирование unit-тестов)
7. **Обновить пороговые значения:** Установить пороги в рекомендуемых диапазонах в конфигурации
8. **Финальная проверка:** 

   - Запустить `yarn test:coverage`
   - Проверить достижение целевых показателей
   - **Критически важно:** Проверить качество тестов - они должны проверять бизнес-логику, а не просто увеличивать coverage

## Ожидаемые результаты

### Целевые показатели покрытия

**Unit тесты (в соответствии с рекомендациями 80-90% statements, 70-85% branches):**

- Текущее: 61.69% statements, 51.99% branches
- Целевое: **85% statements** (в диапазоне 80-90%), **75% branches** (в диапазоне 70-85%)
- Закрыть разрыв: +23.31% statements, +23.01% branches

**Core алгоритмы (рекомендуется >90%):**

- `svg-fingerprinter.ts` - целевое покрытие **≥90%** (core алгоритм хеширования)
- `constraints-evaluator.ts` - целевое покрытие **≥90%** (core алгоритм Levenshtein)
- `resolver.ts` - целевое покрытие **≥85%** (5-фазный алгоритм резолвера)
- `path-builder.ts` - целевое покрытие **≥85%** (алгоритм построения пути)

**Integration тесты (в соответствии с рекомендациями 60-75% statements, 50-65% branches):**

- Текущее: 65.23% statements, 56.29% branches
- Целевое: **70% statements** (в диапазоне 60-75%), **60% branches** (в диапазоне 50-65%)
- Закрыть разрыв: +4.77% statements, +3.71% branches

**Глобальное покрытие (рекомендуется 70-80% statements, 60-70% branches):**

- Целевое: **75% statements**, **65% branches**

### Критерии успеха

**Качественные показатели (приоритет над количественными):**

- ✅ Тесты проверяют бизнес-логику и ломаются при изменении поведения
- ✅ Покрыты негативные сценарии и edge cases
- ✅ Тесты устойчивы к рефакторингу структуры кода
- ✅ Интеграционные тесты проверяют взаимодействие модулей, а не дублируют unit-тесты
- ✅ Нет тестов, написанных исключительно ради покрытия

**Количественные показатели:**

- ✅ Unit тесты: ≥85% statements, ≥75% branches (в рекомендуемых диапазонах)
- ✅ Integration тесты: ≥70% statements, ≥60% branches (в рекомендуемых диапазонах)
- ✅ Core алгоритмы: ≥85-90% покрытие

**Всего новых тестов:** ~150-180 тестовых случаев (расширение существующих + новые файлы)

**Важно:** Coverage используется как защитный механизм от регрессий. Если достижение порогов требует написания бессмысленных тестов, пороги должны быть скорректированы вниз.