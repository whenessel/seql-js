# Variable Naming

Naming conventions for variables, parameters, and local identifiers.

## Format

- **camelCase**: Start with lowercase, capitalize subsequent words
- **Descriptive**: Name should represent the value, not the role
- **No type encoding**: Don't include type information in the name

## Basic Rules

### Allowed

```typescript
const userName = 'john';
const userCount = 10;
const isActive = true;
const userData = fetchUserData(); // Descriptive, not generic
const processResult = processResult(); // Descriptive, not generic
const appConfig = loadConfig(); // Descriptive, not generic
```

### Forbidden

```typescript
const strUserName = 'john'; // Type encoding
const userNameStr = 'john'; // Type encoding
const user_name = 'john'; // snake_case
const UserName = 'john'; // PascalCase
const uName = 'john'; // Abbreviation
const temp = fetchData(); // Too generic (forbidden)
const result = processData(); // Too generic (forbidden)
const value = getValue(); // Too generic (forbidden)
```

## Semantic Naming

### Value-Based (Preferred)

Names should describe what the value represents:

```typescript
const user = getUserById(id);
const orders = fetchOrders();
const totalPrice = calculateTotal();
const errorMessage = 'Failed to load';
```

### Role-Based (Avoid)

Avoid names that describe the role rather than the value:

```typescript
const data = getUserById(id); // Too generic
const result = fetchOrders(); // Too generic
const value = calculateTotal(); // Too generic
```

## Boolean Variables

Boolean variables should use predicate form:

### Allowed

```typescript
const isActive = true;
const hasPermission = false;
const canEdit = true;
const shouldRetry = false;
const isValid = true;
```

### Forbidden

```typescript
const active = true; // Not a predicate
const permission = false; // Not a predicate
const edit = true; // Not a predicate
```

## Collections

Use plural nouns for arrays and collections:

### Allowed

```typescript
const users = [];
const orders = [];
const items = [];
const errors = [];
```

### Forbidden

```typescript
const userList = []; // Redundant suffix
const orderArray = []; // Type encoding
const itemsList = []; // Redundant suffix
```

## Loop Variables

### Short Names in Small Scopes

For simple loops, short names are acceptable:

```typescript
for (let i = 0; i < items.length; i++) {
  processItem(items[i]);
}

for (const item of items) {
  processItem(item);
}

items.forEach((item, index) => {
  processItem(item, index);
});
```

### Descriptive Names in Larger Scopes

For nested loops or complex logic, use descriptive names:

```typescript
for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    processCell(rows[rowIndex], columns[colIndex]);
  }
}
```

## Temporary Variables

Even temporary variables should be descriptive:

### Allowed

```typescript
const intermediateResult = calculateIntermediate();
const cachedValue = cache.get(key);
const transformedData = transform(data);
```

### Forbidden

```typescript
const temp = calculateIntermediate(); // Too generic
const tmp = cache.get(key); // Abbreviation
const x = transform(data); // Single letter
```

## Parameters

Function parameters follow the same rules as variables:

### Allowed

```typescript
function processUser(user: User, options: ProcessOptions) {
  const userName = user.name;
  // ...
}
```

### Forbidden

```typescript
function processUser(u: User, opts: ProcessOptions) {
  // Abbreviations
  const un = u.name; // Abbreviation
  // ...
}
```

## Destructuring

Use descriptive names when destructuring:

### Allowed

```typescript
const { userName, email } = user;
const { totalPrice, itemCount } = order;
```

### Forbidden

```typescript
const { name: n, email: e } = user; // Single letters
const { totalPrice: tp } = order; // Abbreviation
```

## Constants

See [constants.md](./constants.md) for constant naming (UPPER_SNAKE_CASE).

## Examples

### Good

```typescript
const user = getUserById(userId);
const isUserActive = user.status === 'active';
const activeUsers = users.filter((u) => u.isActive);
const userCount = activeUsers.length;
```

### Bad

```typescript
const u = getUserById(uid); // Abbreviations
const active = user.status === 'active'; // Not a predicate
const usrs = users.filter((x) => x.a); // Abbreviations
const cnt = usrs.length; // Abbreviation
```
