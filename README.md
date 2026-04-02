# Smart Search Web Component

A high-performance, accessible, and framework-agnostic Web Component designed for modern wealth management platforms. Built with Lit and TypeScript, this component provides a unified search experience for accounts, transactions, and banking entities.

## Setup & Execution
1. **Install:** `npm install`
2. **Dev Mode:** `npm run dev`
3. **Run Tests:** `npx playwright test`


## Usage Examples
**Basic HTML Implementation:** 
```
<smart-search 
  placeholder="Search accounts..." 
  theme="light">
</smart-search>

<script type="module">
  import './src/components/smart-search.ts';
  const search = document.querySelector('smart-search');
  
  // Inject data
  search.data = [
    { id: '1', title: 'Account 123456', category: 'Saving Account', description: 'Opened in 2025' },
    { id: '2', title: 'Account 556677', category: 'Current Account' }
  ];

  // Listen for selection
  search.addEventListener('item-selected', (e) => {
    console.log('Selected:', e.detail);
  });
</script>
```

## API Documentation
**Properties** 
| Property | Type | Default | Description
| -------- | -------- | -------- | -------- |
| `data` | `SearchResult[]` | `[]` | A flexible collection of searchable entities (Accounts, Transactions, Customers, etc.)
| `placeholder` | `string` | `'Search...'` | Customisable placeholder text for input field
| `theme` | `'light' \| 'dark'` | `'light'` | Controls the theme (light/dark mode)
  
**SearchResult Data Schema**  
For consistency, all data passed to this data property must follow this schema:
| Field | Type | Required | Description
| -------- | -------- | -------- | -------- |
| `id` | `number` | Yes | Unique identifier for the entity
| `title` | `string` | Yes | Primary display text (i.e. Account Number, Customer Name, etc.)
| `category` | `string` | Yes | For visual grouping and result filtering
| `description` | `string` | No | Secondary details (i.e. Account Type, Customer NRIC, etc.)
| `metadata` | `Record<String, any>` | No | Additional custom data (i.e. URL, file, etc.)
  
**Events** 
| Event Name | Detail | Description
| -------- | -------- | -------- |
| `item-selected` | `SearchResult` | Fires when user selects a result via keyboard or mouse

## Technical Justifications
**Why Lit?**  
We avoid "Framework Lock-in." This component works in React, Angular, or legacy portals without modification. It is also a highly efficient "reactive" rendering system that only updates the specific parts of the DOM that change.  
  
**Why Vite?**  
We favour its near-instant build times and native ESM support.  
  
**Why Playwright & Axe-core?**  
Playwright for E2E testing because it tests in real browsers. Axe-core for automated WCAG auditing.  

**Accessibility:**  
Implemented ARIA Combobox patterns with an non-intrusive `polite` live-region announcer for screen readers.  

**User friendliness:**  
Component correctly focuses during keyboard navigation and ensures focus is returned to the input after a "Clear Search" action.  
  
**Security:**  
Integrated sanitization in the highlighting logic to mitigate XSS risks- a non-negotiable for banking software. Also, data lookups use Optional Chaining (?.) and boundary checks to prevent crashes when dealing with missing data.  

**Data Architecture:**  
Having a 'Metadata Payload' allows the component to carry banking entity data (IDs, balances, URLs, etc.) to the parent app for selection.

## Testing Coverage
The test suite is located in /tests and covers:
- **Rendering:** Verifying the initial DOM structure.
- **Interaction:** Full validation of ArrowUp, ArrowDown, Home, End, and Escape keys.
- **Communication:** Verifying that the item-selected event carries the full metadata payload to the host app.
- **Assessbility:** Automated WCAG 2.2 audit via Axe-core.
- **Edge Cases:** Handling "No Results Found" and rapid typing (input handling).
- **Theming:** Checking CSS variable updates when the theme attribute is toggled.
