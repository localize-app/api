# Dashboard Implementation Guide: Date & Currency Configuration

## Overview
The API now supports granular date and currency formatting configuration in project settings. This guide explains what needs to be implemented in the dashboard to allow users to configure these options.

## API Changes Summary

### New Configuration Structure

```typescript
interface ProjectSettings {
  // Existing fields...

  // Date Configuration
  dateHandling: boolean;           // true = service handles dates, false = customer handles
  dateOptions?: {
    format?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'MMMM DD, YYYY' | 'MMM DD, YYYY';
    timeFormat?: '12h' | '24h';
    timezone?: string;             // e.g., "America/New_York", "Europe/London"
  };

  // Currency Configuration
  ignoreCurrency: boolean;         // false = service handles currency, true = customer handles
  currencyOptions?: {
    symbolPosition?: 'before' | 'after';      // e.g., $100 vs 100$
    decimalSeparator?: '.' | ',';             // e.g., 1.5 vs 1,5
    thousandsSeparator?: ',' | '.' | ' ' | ''; // e.g., 1,000 vs 1.000 vs 1 000
    decimalPlaces?: number;                   // 0-4, default: 2
  };
}
```

### Available Enums

**Date Formats:**
- `ISO`: YYYY-MM-DD (2025-11-14)
- `US`: MM/DD/YYYY (11/14/2025)
- `EU`: DD/MM/YYYY (14/11/2025)
- `LONG`: MMMM DD, YYYY (November 14, 2025)
- `SHORT`: MMM DD, YYYY (Nov 14, 2025)

**Time Formats:**
- `12h`: 12-hour format (3:30 PM)
- `24h`: 24-hour format (15:30)

**Currency Symbol Position:**
- `before`: $100
- `after`: 100$

**Decimal Separator:**
- `.`: Period (1.5)
- `,`: Comma (1,5)

**Thousands Separator:**
- `,`: Comma (1,000)
- `.`: Period (1.000)
- ` `: Space (1 000)
- `''`: None (1000)

## Dashboard Implementation Tasks

### 1. Project Settings UI Component

Create or update the project settings page to include two new sections:

#### Date Handling Section
```tsx
<FormSection title="Date Handling">
  <Toggle
    label="Enable date handling"
    description="Let the service handle date formatting for your customers"
    checked={settings.dateHandling}
    onChange={(checked) => updateSettings({ dateHandling: checked })}
  />

  {settings.dateHandling && (
    <ExpandedOptions>
      <Select
        label="Date Format"
        options={[
          { value: 'YYYY-MM-DD', label: 'ISO (2025-11-14)' },
          { value: 'MM/DD/YYYY', label: 'US (11/14/2025)' },
          { value: 'DD/MM/YYYY', label: 'EU (14/11/2025)' },
          { value: 'MMMM DD, YYYY', label: 'Long (November 14, 2025)' },
          { value: 'MMM DD, YYYY', label: 'Short (Nov 14, 2025)' },
        ]}
        value={settings.dateOptions?.format}
        onChange={(format) => updateSettings({
          dateOptions: { ...settings.dateOptions, format }
        })}
      />

      <Select
        label="Time Format"
        options={[
          { value: '12h', label: '12-hour (3:30 PM)' },
          { value: '24h', label: '24-hour (15:30)' },
        ]}
        value={settings.dateOptions?.timeFormat || '12h'}
        onChange={(timeFormat) => updateSettings({
          dateOptions: { ...settings.dateOptions, timeFormat }
        })}
      />

      <Input
        label="Timezone (Optional)"
        placeholder="e.g., America/New_York"
        value={settings.dateOptions?.timezone || ''}
        onChange={(timezone) => updateSettings({
          dateOptions: { ...settings.dateOptions, timezone }
        })}
      />
    </ExpandedOptions>
  )}
</FormSection>
```

#### Currency Handling Section
```tsx
<FormSection title="Currency Handling">
  <Toggle
    label="Customer handles currency"
    description="Turn off if you want the service to handle currency formatting"
    checked={settings.ignoreCurrency}
    onChange={(checked) => updateSettings({ ignoreCurrency: checked })}
  />

  {!settings.ignoreCurrency && (
    <ExpandedOptions>
      <RadioGroup
        label="Symbol Position"
        options={[
          { value: 'before', label: 'Before ($100)' },
          { value: 'after', label: 'After (100$)' },
        ]}
        value={settings.currencyOptions?.symbolPosition || 'before'}
        onChange={(symbolPosition) => updateSettings({
          currencyOptions: { ...settings.currencyOptions, symbolPosition }
        })}
      />

      <Select
        label="Decimal Separator"
        options={[
          { value: '.', label: 'Period (1.50)' },
          { value: ',', label: 'Comma (1,50)' },
        ]}
        value={settings.currencyOptions?.decimalSeparator || '.'}
        onChange={(decimalSeparator) => updateSettings({
          currencyOptions: { ...settings.currencyOptions, decimalSeparator }
        })}
      />

      <Select
        label="Thousands Separator"
        options={[
          { value: ',', label: 'Comma (1,000)' },
          { value: '.', label: 'Period (1.000)' },
          { value: ' ', label: 'Space (1 000)' },
          { value: '', label: 'None (1000)' },
        ]}
        value={settings.currencyOptions?.thousandsSeparator || ','}
        onChange={(thousandsSeparator) => updateSettings({
          currencyOptions: { ...settings.currencyOptions, thousandsSeparator }
        })}
      />

      <NumberInput
        label="Decimal Places"
        min={0}
        max={4}
        value={settings.currencyOptions?.decimalPlaces || 2}
        onChange={(decimalPlaces) => updateSettings({
          currencyOptions: { ...settings.currencyOptions, decimalPlaces }
        })}
      />
    </ExpandedOptions>
  )}
</FormSection>
```

### 2. API Integration

#### Update Project Settings Type
```typescript
// types/project.ts or similar
export interface DateOptions {
  format?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'MMMM DD, YYYY' | 'MMM DD, YYYY';
  timeFormat?: '12h' | '24h';
  timezone?: string;
}

export interface CurrencyOptions {
  symbolPosition?: 'before' | 'after';
  decimalSeparator?: '.' | ',';
  thousandsSeparator?: ',' | '.' | ' ' | '';
  decimalPlaces?: number;
}

export interface ProjectSettings {
  // ... existing fields
  dateHandling: boolean;
  dateOptions?: DateOptions;
  ignoreCurrency: boolean;
  currencyOptions?: CurrencyOptions;
}
```

#### API Calls
Use the existing project settings endpoints:

**Update Settings:**
```typescript
PATCH /projects/:id/settings
Content-Type: application/json

{
  "dateHandling": true,
  "dateOptions": {
    "format": "MM/DD/YYYY",
    "timeFormat": "12h",
    "timezone": "America/New_York"
  },
  "ignoreCurrency": false,
  "currencyOptions": {
    "symbolPosition": "before",
    "decimalSeparator": ".",
    "thousandsSeparator": ",",
    "decimalPlaces": 2
  }
}
```

### 3. User Experience Considerations

1. **Progressive Disclosure**: Only show advanced options when the main toggle is enabled
2. **Defaults**: Use sensible defaults based on project locale
3. **Preview**: Show a live preview of how dates/currencies will be formatted
4. **Validation**:
   - Ensure decimal and thousands separators are different
   - Validate timezone strings against IANA timezone database
5. **Help Text**: Provide clear descriptions of what each option does

### 4. localize.js Integration Notes

**For the JavaScript client library team:**

When `dateHandling: true`:
- The service will format dates according to `dateOptions`
- Parse date values and apply the specified format
- Use the timezone setting for date conversions

When `ignoreCurrency: false`:
- The service will format currency values according to `currencyOptions`
- Apply symbol position, separators, and decimal places
- Currency symbols should be locale-aware (use locale's currency)

**Example Implementation in localize.js:**
```javascript
// When fetching project config
const config = await fetch(`/api/projects/${projectId}`);
const { settings } = config;

// Format dates if enabled
if (settings.dateHandling) {
  const formattedDate = formatDate(date, {
    format: settings.dateOptions?.format || 'YYYY-MM-DD',
    timeFormat: settings.dateOptions?.timeFormat || '12h',
    timezone: settings.dateOptions?.timezone
  });
}

// Format currency if enabled
if (!settings.ignoreCurrency) {
  const formattedAmount = formatCurrency(amount, {
    symbolPosition: settings.currencyOptions?.symbolPosition || 'before',
    decimalSeparator: settings.currencyOptions?.decimalSeparator || '.',
    thousandsSeparator: settings.currencyOptions?.thousandsSeparator || ',',
    decimalPlaces: settings.currencyOptions?.decimalPlaces || 2
  });
}
```

## Testing Checklist

- [ ] Toggle date handling on/off
- [ ] Test all date format options with live preview
- [ ] Test 12h vs 24h time formats
- [ ] Test timezone input validation
- [ ] Toggle currency handling on/off
- [ ] Test all currency format combinations
- [ ] Verify separators don't conflict
- [ ] Test decimal places (0-4)
- [ ] Verify settings persist on save
- [ ] Test settings load correctly on page refresh
- [ ] Verify API validation errors display properly

## API Endpoints Reference

- `GET /projects/:id` - Get project with settings
- `PATCH /projects/:id/settings` - Update project settings
- `POST /projects` - Create project (settings can be included)

## Questions?

If you need clarification or have questions about the implementation, refer to:
- API Entity: `/src/projects/entities/project-settings.entity.ts`
- DTOs: `/src/projects/dto/create-project.dto.ts` and `/src/projects/dto/update-project.dto.ts`
- Service: `/src/projects/projects.service.ts`
