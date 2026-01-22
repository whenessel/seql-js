# Table Examples

Identifying table cells using nth-child positioning (v1.1.0).

## Simple Table

```html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Age</th>
      <th>City</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John</td>
      <td>25</td>
      <td>NYC</td>
    </tr>
    <tr>
      <td>Jane</td>
      <td>30</td>
      <td>LA</td>
    </tr>
  </tbody>
</table>
```

```typescript
import { generateSEQL } from 'seql-js';

// Target the "Age" cell in second row
const ageCell = document.querySelector('tbody tr:nth-child(2) td:nth-child(2)');
const selector = generateSEQL(ageCell);
// "v1: table :: tbody > tr[nthChild=2] > td[nthChild=2]"
```

## Table Header

```typescript
const nameHeader = document.querySelector('th:first-child');
generateSEQL(nameHeader);
// "v1: table :: thead > tr > th[nthChild=1,text="Name"]"
```

## Data Table with Actions

```html
<table>
  <tr>
    <td>Product A</td>
    <td>$99</td>
    <td><button>Edit</button></td>
  </tr>
</table>
```

```typescript
const editBtn = document.querySelector('tr:first-child td:last-child button');
generateSEQL(editBtn);
// "v1: table :: tr[nthChild=1] > td[nthChild=3] > button[text="Edit"]"
```

## Tracking Cell Clicks

```typescript
import { generateSEQL } from 'seql-js';

document.querySelectorAll('td').forEach((cell) => {
  cell.addEventListener('click', () => {
    const selector = generateSEQL(cell);
    console.log('Cell clicked:', selector);
  });
});
```
