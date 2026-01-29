# Developer Guide: Number Formatting Standards

Consistent data presentation is critical for institutional trust. This guide outlines the standardized formatting utilities available in `src/utils/formatNumber.ts`.

All components MUST use these utilities instead of raw `.toLocaleString()` or string concatenation.

## Core Utility: `formatNumber()`

The universal formatting function.

```typescript
import { formatNumber } from '@/utils/formatNumber';

// Basic Usage
formatNumber(1234.56) 
// Output: "1,234.56"

// With Options
formatNumber(1234567890, { 
    prefix: '$', 
    suffix: 'B', 
    decimals: 2 
}) 
// Output: "$1.23B" (Note: Logic handles scaling if you pass pre-scaled numbers, be careful)
// *Current implementation assumes input is ALREADY scaled if you just append a suffix string.*
// *Use formatCompact for auto-scaling.*
```

## Specialized Wrappers

### 1. Currency
Use for all dollar-denominated values.

```typescript
import { formatCurrency } from '@/utils/formatNumber';

formatCurrency(12500.50)
// Output: "$12,500.50"

formatCurrency(2.4, { suffix: 'B' })
// Output: "$2.40B"
```

### 2. Percentages
Use for yields, deltas, and ratios.

```typescript
import { formatPercentage } from '@/utils/formatNumber';

formatPercentage(0.0512)
// Output: "5.12%"

formatPercentage(0.0512, { showSign: true })
// Output: "+5.12%"
```

### 3. Compact Notation (Auto-Scaling)
Use when you have raw numbers (e.g., 1,500,000,000) and need "1.5B".

```typescript
import { formatCompact } from '@/utils/formatNumber';

formatCompact(1500000000)
// Output: "1.5B"

formatCompact(1500000)
// Output: "1.5M"
```

## Best Practices
1. **Deltas**: Always use `showSign: true` for change values.
2. **Decimals**:
    - Trillions/Billions: 2 decimals (e.g., $1.25T)
    - Percentages: 2 decimals (e.g., 5.25%)
    - Basis Points: 0 decimals (e.g., 25 bps)
3. **Null Handling**: The utilities handle `null` or `undefined` by returning a placeholder key or default value if configured, but generally components should handle null checks before rendering.
