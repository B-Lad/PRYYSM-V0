# Pryysm MES v3.0

Additive Manufacturing Execution System — internal tool for Dubai AM operations.

## Project Structure

```
pryysm/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              ← entry point
    ├── App.jsx               ← shell: sidebar, topbar, routing
    ├── styles.js             ← all CSS (single source of truth)
    │
    ├── hooks/
    │   └── useLive.js        ← machine live-tick simulation (→ Supabase Realtime)
    │
    ├── data/
    │   ├── constants.js      ← SM, SL, TECH_C, DEPT_C, DT_CODES
    │   ├── nav.js            ← NAV array
    │   ├── seed.js           ← all seed data (→ replace with Supabase queries)
    │   ├── matCatalog.js     ← MAT_CATALOG, BLANK_MAT, BLANK_GROUP
    │   └── index.js          ← barrel export
    │
    ├── components/
    │   └── atoms.jsx         ← Ring, Spark, Prog, GRow, AStrip, Modal,
    │                            Tabs, LiveBadge, BudgetBar, TB, SB, DB
    │
    └── modules/
        ├── Overview.jsx
        ├── PrintRequests.jsx       ← + NewRequestWizard + lifecycle modals
        ├── Projects.jsx
        ├── Machines.jsx
        ├── Flow.jsx
        ├── DeptCost.jsx
        ├── Performance.jsx
        ├── Config.jsx
        ├── Admin.jsx
        ├── PrinterFleet.jsx        ← largest module (567 lines)
        ├── PrintSchedule.jsx
        ├── JobAllotment.jsx
        ├── RawMaterialInventory.jsx
        ├── AMReview.jsx            ← core module (1119 lines) — split further next
        └── SpareStores.jsx
```

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
# Output → dist/
# Deploy dist/ to Vercel or any static host
```

## Next Steps → Supabase Migration

Replace seed data in `src/data/seed.js` with Supabase queries:

| Current constant   | Supabase table        |
|--------------------|-----------------------|
| LC_SEED            | jobs                  |
| MACHINES_BASE      | machines              |
| DEPARTMENTS        | departments           |
| PROJECTS           | projects              |
| WOS                | work_orders           |
| MATERIALS_DATA     | materials             |
| RAW_FILAMENTS      | raw_inventory         |
| RAW_RESINS         | raw_inventory         |
| RAW_POWDERS        | raw_inventory         |
| SPARE_SEED         | spare_parts           |
| SCHEDULE_JOBS      | printer_schedule      |
| ALLOT_QUEUE        | allotment_queue       |

Add Supabase auth → wrap App with `<SessionContextProvider>`.
Add RLS policies per department code.
