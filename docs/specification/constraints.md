# Constraints

Disambiguation rules for element resolution.

## Constraint Types

### 1. Uniqueness Constraint

Ensures only one element matches.

```typescript
interface UniquenessConstraint {
  type: 'uniqueness';
  required: boolean; // Fail if multiple matches
}
```

### 2. Text Proximity Constraint

Element must be near specific text.

```typescript
interface TextProximityConstraint {
  type: 'textProximity';
  text: string; // Text to find
  maxDistance: number; // Max pixels away
}
```

### 3. Position Constraint

Element at specific position in list.

```typescript
interface PositionConstraint {
  type: 'position';
  index: number; // 0-based index
}
```

### 4. Visibility Constraint

Element must be visible.

```typescript
interface VisibilityConstraint {
  type: 'visibility';
  required: boolean;
}
```

## Application

Constraints are applied in Phase 4 of resolution, after semantic filtering.

## Example

```json
{
  "constraints": [
    { "type": "uniqueness", "required": true },
    { "type": "visibility", "required": true }
  ]
}
```
