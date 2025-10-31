# Community Food Bank Ops — Progressive Web App

A **functional operations web app** for a community food bank or non-profit that manages:
- **Donations intake**
- **Inventory tracking**
- **Pickup scheduling**
- **Impact dashboards**
- **CSV import/export**
- **Offline access (PWA)**

This artifact demonstrates **business value**, **technical depth**, and **AI-assisted design thinking**.  
It was built collaboratively with generative AI to model how low-cost digital tools can transform community logistics.

---

##  Business Value

**Problem:** Many small food banks and non-profits track donations, inventory, and client pickups with spreadsheets or paper forms, leading to inefficiency and data loss.

**Solution:** This app digitizes those workflows in a single browser-based PWA that:
- Works **offline** at community events.
- Provides **data visibility** through KPIs and charts.
- **Reduces manual errors** and redundant entry.
- Enables **quick CSV reporting** for audits and grants.

Result: operational efficiency, transparency, and community impact — all with zero infrastructure cost.

---

##  Where AI Was Used

AI was used to:
- **Brainstorm the concept** (operational workflow + business logic).
- **Generate boilerplate HTML/CSS/JS** for accessibility and responsiveness.
- **Draft and refine** this README and the Reflection summary.
- **Validate the technical stack** (localStorage persistence, service worker caching, and chart rendering).

The AI’s role was as a **co-developer and technical writer**, helping accelerate prototype development and ensure professional documentation.

---

##  How to Use

### Local Demo
```bash
python -m http.server 5173
# visit http://localhost:5173
```

### Core Tabs
| Tab | Function |
|------|-----------|
| **Intake** | Log donations by donor, item, quantity, and weight. |
| **Inventory** | Auto-aggregates current stock; adjust quantities live. |
| **Schedule** | Record and manage client pickup appointments. |
| **Dashboard** | View KPIs and category-based charts. |
| **Settings** | Export/Import CSV data, view about info. |

### Data Persistence
All data is stored locally in the browser (localStorage).  
To back up, use “Export CSV” in **Settings**.

### Deployment
Deploy on GitHub Pages:
```bash
git push -u origin main
# Settings → Pages → Deploy from branch → main (root)
```

Your app will be live at:  
`https://USERNAME.github.io/foodbank-ops/`

---

##  Tech Stack
- **HTML / CSS / JavaScript (Vanilla)** — lightweight, dependency-free
- **Canvas** — chart rendering
- **localStorage** — persistent state
- **Service Worker + Manifest** — offline caching (PWA)
- **CSV utilities** — manual export/import
- **Accessibility-first** — labels, focus order, ARIA status

---

##  License
MIT License — free for educational and community use.
