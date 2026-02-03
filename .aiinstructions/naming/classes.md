# Class Naming

Naming conventions for classes and constructors.

## Format

- **PascalCase**: Capitalize first letter of each word
- **Noun-based**: Class names should be nouns representing concepts
- **Domain suffixes allowed**: Service, Processor, Client, Handler, Loader, Validator, Gateway, Repository (represent domain concepts)
- **Technical suffixes forbidden**: Manager, Helper, Util (indicate unclear responsibility)

## Basic Rules

### Allowed

```typescript
class UserService { ... }
class DataProcessor { ... }
class ApiClient { ... }
class ConfigLoader { ... }
class ErrorHandler { ... }
```

### Forbidden

```typescript
class userService { ... }           // camelCase
class data_processor { ... }        // snake_case
class data-processor { ... }        // kebab-case
class UserServiceManager { ... }    // Manager suffix
class DataHelper { ... }            // Helper suffix
class ApiUtil { ... }               // Util suffix
```

## Concept-Based Naming

Class names should represent concepts, not behaviors:

### Allowed

```typescript
class UserService { ... }           // Represents user operations domain
class OrderProcessor { ... }         // Represents order processing domain
class PaymentGateway { ... }        // Represents payment interface domain
class CacheRepository { ... }        // Represents cache data access domain
```

### Forbidden

```typescript
class ProcessUser { ... }            // Verb-based (use for functions)
class HandleOrder { ... }            // Verb-based
class ManagePayment { ... }          // Verb-based
```

## Service Classes

Service classes typically end with "Service":

```typescript
class UserService { ... }
class OrderService { ... }
class PaymentService { ... }
class NotificationService { ... }
```

## Processor Classes

Processor classes typically end with "Processor":

```typescript
class DataProcessor { ... }
class ImageProcessor { ... }
class RequestProcessor { ... }
```

## Client Classes

Client classes typically end with "Client":

```typescript
class ApiClient { ... }
class HttpClient { ... }
class DatabaseClient { ... }
```

## Handler Classes

Handler classes typically end with "Handler":

```typescript
class ErrorHandler { ... }
class RequestHandler { ... }
class EventHandler { ... }
```

## Abstract Classes

Abstract classes follow the same rules. Prefer concept names without prefixes:

```typescript
abstract class Service { ... }
abstract class Processor { ... }
abstract class Handler { ... }
```

If prefix is needed for clarity, "Base" is preferred over "Abstract":

```typescript
abstract class BaseService { ... }
abstract class BaseProcessor { ... }
```

**Note**: Avoid prefixes when possible - prefer domain-specific names like `UserService` over `BaseService`.

## Interface Implementation

Classes implementing interfaces should reflect the interface name:

```typescript
interface UserRepository { ... }
class DatabaseUserRepository implements UserRepository { ... }
class InMemoryUserRepository implements UserRepository { ... }
```

## Generic Classes

Generic classes should have clear type parameter names:

```typescript
class Repository<T> { ... }
class Cache<K, V> { ... }
class Service<TEntity, TId> { ... }
```

## Allowed Domain Suffixes

The following suffixes are allowed because they represent domain concepts, not technical roles:

- **Service**: Business logic operations (UserService, OrderService)
- **Processor**: Data transformation (DataProcessor, ImageProcessor)
- **Client**: External interface (ApiClient, HttpClient)
- **Handler**: Event/request handling (ErrorHandler, RequestHandler)
- **Loader**: Data loading (ConfigLoader, DataLoader)
- **Validator**: Validation logic (UserValidator, DataValidator)
- **Gateway**: External system interface (PaymentGateway, ApiGateway)
- **Repository**: Data access (UserRepository, OrderRepository)

## Forbidden Technical Suffixes

The following suffixes are forbidden because they indicate unclear responsibility or technical implementation details:

- **Manager**: Too generic, use Service, Repository, or specific domain name
- **Helper**: Unclear purpose, use specific domain name
- **Util**: Unclear purpose, use specific domain name

### Examples

```typescript
// Bad: Technical suffixes
class UserManager { ... }           // Too generic - use UserService
class DataHelper { ... }             // Unclear - use DataValidator or DataProcessor
class ApiUtil { ... }                // Unclear - use ApiClient

// Good: Domain suffixes
class UserService { ... }           // Clear domain concept
class DataValidator { ... }         // Specific domain purpose
class ApiClient { ... }              // Clear domain concept
```

## Examples

### Good

```typescript
class UserService {
  getUserById(id: string): User { ... }
  createUser(data: UserData): User { ... }
}

class DataProcessor {
  process(data: Data): ProcessedData { ... }
}

class ApiClient {
  request(endpoint: string): Promise<Response> { ... }
}

// AST/Parser domain examples
class Parser {
  parse(input: string): AstNode { ... }
}

class Tokenizer {
  tokenize(input: string): Token[] { ... }
}

class AstNode {
  // AST node representation
}

class SelectorResolver {
  resolve(selector: string): Element[] { ... }
}
```

### Bad

```typescript
class userService { ... }                    // Wrong case
class User_Service { ... }                   // Wrong separator
class UserServiceManager { ... }             // Unnecessary suffix
class ProcessUser { ... }                    // Verb-based
class UserHelper { ... }                     // Helper suffix
```

## Inheritance

Base classes should clearly indicate their role:

```typescript
abstract class BaseService { ... }
class UserService extends BaseService { ... }

abstract class AbstractRepository<T> { ... }
class UserRepository extends AbstractRepository<User> { ... }
```

## Composition Over Inheritance

When using composition, name classes by their primary responsibility:

```typescript
class UserService {
  constructor(
    private repository: UserRepository,
    private validator: UserValidator
  ) { ... }
}
```
