# Internal Naming

Naming conventions for non-exported symbols and internal implementation.

## Scope

Internal naming applies to:
- Non-exported functions
- Non-exported classes
- Private methods and properties
- Local variables
- Implementation details

## Rules

### Short Names in Small Scopes

Short names are acceptable in small, local scopes:

```typescript
// Good: Short names in small scope
for (let i = 0; i < items.length; i++) {
  processItem(items[i]);
}

items.forEach((item, index) => {
  const result = processItem(item);
  return result;
});
```

### Descriptive Names in Larger Scopes

Use descriptive names for larger scopes or complex logic:

```typescript
// Good: Descriptive names for complex logic
function processUserOrders(userId: string, orderIds: string[]): ProcessResult {
  const userOrders = orderIds.map(orderId => {
    const order = fetchOrder(orderId);
    return validateOrder(order);
  });
  return aggregateResults(userOrders);
}
```

## Loop Indices

Short names are acceptable for loop indices:

### Allowed

```typescript
for (let i = 0; i < rows.length; i++) {
  for (let j = 0; j < columns.length; j++) {
    processCell(rows[i], columns[j]);
  }
}

items.forEach((item, index) => {
  processItem(item, index);
});
```

### Descriptive When Needed

For nested loops or complex logic, use descriptive names:

```typescript
for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    processCell(rows[rowIndex], columns[colIndex]);
  }
}
```

## Temporary Variables

Temporary variables must be descriptive. Generic names like `temp`, `result`, `value`, `data` are forbidden except in very small scopes (1-2 lines) where the context is immediately clear:

### Forbidden (Too Generic)

```typescript
// Bad: Generic names in function scope
function processData(data: Data): ProcessedData {
  const temp = calculateIntermediate();    // Too generic
  const result = processData(data);        // Too generic
  const value = getValue();                // Too generic
  return result;
}
```

### Allowed (Very Small Scope Only)

```typescript
// Acceptable: Generic name in very small scope (1-2 lines)
const result = processData(data);
return result;

// Or in immediate return
return processData(data);
```

### Preferred (Descriptive)

```typescript
// Good: Descriptive names even for temporary variables
function processData(data: Data): ProcessedData {
  const intermediateResult = calculateIntermediate();
  const processedData = processData(data);
  const currentValue = getValue();
  return processedData;
}
```

## Private Methods

Private methods follow the same rules as public methods but can be shorter in context:

```typescript
class UserService {
  public getUserById(id: string): User {
    return this._findUser(id);
  }

  private _findUser(id: string): User {
    // Implementation
  }

  private _validateUser(user: User): boolean {
    // Implementation
  }
}
```

Or using TypeScript `private` keyword:

```typescript
class UserService {
  public getUserById(id: string): User {
    return this.findUser(id);
  }

  private findUser(id: string): User {
    // Implementation
  }

  private validateUser(user: User): boolean {
    // Implementation
  }
}
```

## Still Maintain Clarity

Even for internal code, maintain clarity:

### Good

```typescript
function processData(data: Data): ProcessedData {
  const normalized = normalizeData(data);
  const validated = validateData(normalized);
  return transformData(validated);
}
```

### Bad

```typescript
function processData(d: Data): ProcessedData {
  const n = normalizeData(d);        // Too short
  const v = validateData(n);         // Too short
  return transformData(v);
}
```

## Abbreviations

Avoid abbreviations even in internal code, unless they are in the explicitly allowed list below.

### Widely Accepted Abbreviations (Allowed)

The following abbreviations are widely accepted in the TypeScript/JavaScript ecosystem and may be used:

- **`id`** - Identifier (userId, orderId, elementId)
- **`url`** - Uniform Resource Locator (apiUrl, baseUrl, imageUrl)
- **`api`** - Application Programming Interface (apiClient, apiKey, apiEndpoint)
- **`http`** - Hypertext Transfer Protocol (httpClient, httpRequest, httpStatus)
- **`html`** - Hypertext Markup Language (htmlElement, htmlContent, htmlParser)
- **`dom`** - Document Object Model (domElement, domNode, domManipulation)
- **`ast`** - Abstract Syntax Tree (astNode, astParser, astVisitor)
- **`json`** - JavaScript Object Notation (jsonData, jsonParser, jsonStringify)
- **`xml`** - eXtensible Markup Language (xmlParser, xmlDocument)
- **`css`** - Cascading Style Sheets (cssClass, cssSelector, cssRule)
- **`ui`** - User Interface (uiComponent, uiElement, uiState)

### Allowed Examples

```typescript
const userId = user.id;                    // id - allowed
const apiUrl = 'https://api.example.com';  // api, url - allowed
const httpClient = new HttpClient();       // http - allowed
const htmlElement = document.createElement('div'); // html - allowed
const domNode = document.querySelector('.class'); // dom - allowed
const astParser = new AstParser();         // ast - allowed
```

### Forbidden Abbreviations

Any abbreviation not in the list above is forbidden, even if it seems common:

```typescript
const usrId = user.id;                // usr - forbidden (use userId)
const apiUrlStr = 'https://...';     // Str - forbidden (type encoding)
const usr = getUser();                // usr - forbidden (use user)
const svc = getService();             // svc - forbidden (use service)
const cfg = getConfig();              // cfg - forbidden (use config)
const val = getValue();               // val - forbidden (use value)
const res = getResult();              // res - forbidden (use result)
```

### Very Short Scope Exception

Single-letter variables are acceptable only in very small scopes (loop indices, simple callbacks):

```typescript
// Allowed: Very short scope
for (let i = 0; i < items.length; i++) { ... }
items.forEach((item, index) => { ... });

// Forbidden: Larger scope
function processItems(items: Item[]) {
  const i = items[0];  // Too short for function scope
}
```

## Examples

### Good Internal Code

```typescript
function processUsers(users: User[]): ProcessedUser[] {
  return users
    .filter(user => user.isActive)
    .map(user => {
      const normalizedName = normalizeName(user.name);
      const validatedEmail = validateEmail(user.email);
      return {
        ...user,
        name: normalizedName,
        email: validatedEmail,
      };
    });
}
```

### Bad Internal Code

```typescript
function processUsers(usrs: User[]): ProcessedUser[] {
  return usrs
    .filter(u => u.a)                // Abbreviations
    .map(u => {
      const nn = normalizeName(u.n);  // Too short
      const ve = validateEmail(u.e);  // Too short
      return { ...u, n: nn, e: ve };
    });
}
```

## Scope-Based Naming

Adjust naming based on scope size:

### Small Scope (Few Lines)

```typescript
// Short names acceptable
for (let i = 0; i < items.length; i++) {
  const item = items[i];
  processItem(item);
}
```

### Medium Scope (Function Level)

```typescript
// Descriptive names
function processOrder(order: Order): ProcessedOrder {
  const validatedOrder = validateOrder(order);
  const enrichedOrder = enrichOrder(validatedOrder);
  return transformOrder(enrichedOrder);
}
```

### Large Scope (Class/Module Level)

```typescript
// Very descriptive names
class OrderProcessor {
  private validateOrderData(orderData: OrderData): ValidationResult {
    // Implementation
  }

  private enrichOrderWithMetadata(order: Order): EnrichedOrder {
    // Implementation
  }
}
```

## Summary

- **Short names**: Acceptable in very small scopes (loops, simple callbacks)
- **Descriptive names**: Required in larger scopes (functions, classes)
- **No abbreviations**: Avoid even in internal code
- **Maintain clarity**: Code should be readable regardless of scope
- **Context matters**: Adjust naming based on scope size and complexity
