# Function Naming

Naming conventions for functions and methods.

## Format

- **camelCase**: Start with lowercase, capitalize subsequent words
- **Verb-based**: Function names should start with a verb
- **Descriptive**: Name should clearly indicate what the function does

## Verb Patterns

### Common Verbs

Use standard verb prefixes based on function purpose:

#### Retrieval
- `get*` - Retrieve a value
- `fetch*` - Retrieve from remote source
- `load*` - Load data from storage
- `read*` - Read from source

```typescript
getUserById(id: string): User
fetchUserData(userId: string): Promise<UserData>
loadConfig(): Config
readFile(path: string): string
```

#### Creation
- `create*` - Create new entity
- `build*` - Build/construct something
- `generate*` - Generate new data
- `make*` - Make/create something

```typescript
createUser(data: UserData): User
buildQuery(params: QueryParams): string
generateId(): string
makeRequest(options: RequestOptions): Request
```

#### Updates
- `update*` - Update existing entity
- `set*` - Set a value
- `modify*` - Modify something
- `change*` - Change a value

```typescript
updateUser(id: string, data: Partial<User>): User
setConfig(key: string, value: unknown): void
modifySettings(settings: Settings): void
changeStatus(id: string, status: Status): void
```

#### Deletion
- `delete*` - Delete an entity
- `remove*` - Remove something
- `clear*` - Clear/reset something

```typescript
deleteUser(id: string): void
removeItem(itemId: string): void
clearCache(): void
```

#### Processing
- `transform*` - Transform data (preferred over `process*`)
- `parse*` - Parse string/data
- `serialize*` - Serialize to string
- `validate*` - Validate data
- `normalize*` - Normalize data format
- `process*` - **Avoid**: Use more specific verbs like `transform*`, `parse*`, `validate*` instead

```typescript
transformData(data: Data): TransformedData    // Preferred
parseJson(json: string): object
serializeData(data: Data): string
validateInput(input: unknown): boolean
normalizeText(text: string): string

// Avoid generic process*
processData(data: Data): ProcessedData         // Too generic - use transformData
```

#### Checks
- `is*` - Boolean check (predicate)
- `has*` - Check for existence
- `can*` - Check capability
- `should*` - Check condition

```typescript
isValid(data: unknown): boolean
hasPermission(user: User, action: string): boolean
canEdit(user: User, resource: Resource): boolean
shouldRetry(error: Error): boolean
```

## Function Types

### Predicates

Functions returning boolean should use predicate form:

```typescript
isValid(value: unknown): boolean
isEmpty(array: unknown[]): boolean
hasError(result: Result): boolean
```

### Transformers

Functions that transform data:

```typescript
transformData(data: Data): TransformedData
normalizeText(text: string): string
mapUsers(users: User[]): UserDto[]
```

### Validators

Functions that validate:

```typescript
validateEmail(email: string): boolean
validateUser(user: User): ValidationResult
checkPermissions(user: User): boolean
```

## Method Naming

Methods follow the same rules as functions:

### Allowed

```typescript
class UserService {
  getUserById(id: string): User { ... }
  createUser(data: UserData): User { ... }
  updateUser(id: string, data: Partial<User>): User { ... }
  deleteUser(id: string): void { ... }
  isValid(): boolean { ... }
}
```

### Forbidden

```typescript
class UserService {
  user(id: string): User { ... }           // Not a verb
  create(u: UserData): User { ... }        // Abbreviation
  update_user(id: string): User { ... }   // snake_case
  DeleteUser(id: string): void { ... }    // PascalCase
}
```

## Async Functions

Async functions follow the same naming rules:

```typescript
async getUserById(id: string): Promise<User> { ... }
async fetchUserData(userId: string): Promise<UserData> { ... }
async transformData(data: Data): Promise<TransformedData> { ... }  // Preferred over processData
```

## Event Handlers

Event handlers use `on*` or `handle*` prefix. **Note**: `handle*` is allowed only for event handlers and error handling - it's a domain-specific pattern, not a generic verb.

```typescript
// Event handlers - handle* is acceptable here
onClick(event: MouseEvent): void { ... }
onSubmit(form: FormData): void { ... }
handleError(error: Error): void { ... }           // Error handling - acceptable
handleRequest(request: Request): void { ... }      // Request handling - acceptable

// Bad: handle* used for generic processing
handleData(data: Data): void { ... }              // Too generic - use transformData or processData
```

## Private Methods

Private methods follow the same rules but are prefixed with underscore (if project convention):

```typescript
class UserService {
  private _validateUserData(data: UserData): boolean { ... }
  private _normalizeEmail(email: string): string { ... }
}
```

Or use TypeScript `private` keyword without underscore:

```typescript
class UserService {
  private validateUserData(data: UserData): boolean { ... }
  private normalizeEmail(email: string): string { ... }
}
```

## Forbidden Patterns

### Avoid Generic Verbs

Generic verbs like `handle`, `process`, `do` are too vague and don't describe what the function actually does. Use more specific verbs instead.

```typescript
// Bad: Generic verbs
function handle(data: Data): void { ... }           // Too generic - use handleError, handleRequest (event handlers only)
function process(item: Item): void { ... }          // Too generic - use transformItem, parseItem, validateItem
function do(action: Action): void { ... }           // Too generic - use executeAction, performAction

// Good: Specific verbs
function transformData(data: Data): TransformedData { ... }  // Clear what it does
function parseJson(json: string): object { ... }             // Clear what it does
function validateInput(input: unknown): boolean { ... }     // Clear what it does
function handleError(error: Error): void { ... }             // Event handler - acceptable
```

**Exception**: `handle*` is allowed for event handlers and error handling (see Event Handlers section above).

### Avoid Abbreviations

```typescript
// Bad
function getUsr(id: string): User { ... }      // Abbreviation
function procData(data: Data): void { ... }    // Abbreviation
function valInput(input: unknown): boolean { ... } // Abbreviation
```

### Avoid Non-Verb Names

```typescript
// Bad
function user(id: string): User { ... }        // Not a verb
function data(): Data { ... }                 // Not a verb
function result(): Result { ... }             // Not a verb
```

## Examples

### Good

```typescript
function getUserById(id: string): User { ... }
function createUser(data: UserData): User { ... }
function updateUser(id: string, data: Partial<User>): User { ... }
function deleteUser(id: string): void { ... }
function isValidEmail(email: string): boolean { ... }
function transformUserData(data: UserData): UserDto { ... }

// AST/Parser domain examples
function parseExpression(input: string): AstNode { ... }
function tokenizeInput(input: string): Token[] { ... }
function resolveSelector(selector: string): Element[] { ... }
function generateSelector(element: Element): string { ... }
function validateAstNode(node: AstNode): boolean { ... }
```

### Bad

```typescript
function user(id: string): User { ... }                    // Not a verb
function create(u: UserData): User { ... }                 // Abbreviation
function update_user(id: string): User { ... }            // snake_case
function DeleteUser(id: string): void { ... }              // PascalCase
function handle(data: Data): void { ... }                  // Too generic - use handleError (event handler) or transformData
function process(item: Item): void { ... }                // Too generic - use transformItem, parseItem, or validateItem
```
