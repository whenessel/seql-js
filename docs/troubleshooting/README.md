# Troubleshooting

Common issues and solutions.

- **[Generation Issues](./generation-issues.md)** - Problems generating EIDs
- **[Resolution Failures](./resolution-failures.md)** - Can't find elements
- **[Performance](./performance.md)** - Optimization tips

## Quick Diagnostics

### Generation Returns Null

1. Check if element is connected to DOM
2. Verify element has semantic features
3. Check confidence threshold

### Resolution Finds Nothing

1. Verify selector is valid
2. Check if element still exists
3. Try with different root context

### Low Performance

1. Enable caching
2. Use batch processing for multiple elements
3. Reduce path depth
