---
name: civic-ui-workstation
description: >-
  Design guidelines, component patterns, keyboard accessibility, and printable
  receipt standards for building an authoritative, zero-slop municipal workstation.
---

# Civic UI Workstation Skill

## Design System & Color Palette
- **Primary Navy**: `#0B192C` (Authority, Trust, Governance)
- **Civic Forest Green**: `#1E5128` (Public Good, Resolution, Verified Badges)
- **Warning / Action Amber**: `#F59E0B` (SLA Warning, Attention)
- **Emergency Crimson**: `#DC2626` (SOS Alerts, Breached SLAs)
- **Surface Background**: `#F8FAFC` (Clean, High-Readability Editorial Slate)
- **Typography**: Inter / Outfit for clean legibility; serif accents for official receipts.

## Key Component Patterns

### 1. Living Ward Profile HUD
Persistent top bar status indicator:
```tsx
<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
  <span className="font-semibold text-slate-800">Ward {wardId}: {wardName}</span>
  <span className="text-slate-400">|</span>
  <span className="text-slate-600">{language.toUpperCase()}</span>
</div>
```

### 2. Civic Command Palette (`Cmd+K`)
Global keyboard navigator allowing instantaneous jump to services:
- *Pay Property Tax Online*
- *Report Water Pipeline Leak*
- *Track Grievance Ticket*
- *Download Citizen Charter PDF*
- *Switch Language (Hindi, Marathi, English)*

### 3. Nature-Style Citation Hover Card
Anchor popovers to citation chips `[S1]`, `[S2]`:
- Displays document title, official circular number, publishing date, and verbatim excerpt.
- 200ms enter delay, 150ms leave delay to prevent reading flicker.

### 4. Printable Administrative Receipt / Dossier
Tailored `@media print` CSS for citizen grievance slips and tax calculation breakdowns:
```css
@media print {
  body { background: white !important; color: black !important; }
  .no-print { display: none !important; }
  .print-receipt { border: 1px solid #000; padding: 24px; font-family: serif; }
  .page-break { page-break-before: always; }
}
```
