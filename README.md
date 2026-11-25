# JALALI COSMETICS

### BEAUTY. BUSINESS. TRUST.

Premium Wholesale Beauty & Cosmetics Commerce Platform.

---

## Project Overview

JALALI COSMETICS is a professional wholesale cosmetics commerce platform designed for distributors, retailers, business partners and customers.

The platform combines a modern online storefront with a centralized management system.

## Main Features

### Storefront
- Professional Persian RTL interface
- Responsive desktop and mobile design
- Product catalog and advanced search
- Product categories and brands
- Product details and image galleries
- Shopping cart and checkout
- Customer accounts
- Order history and order tracking

### Wholesale Commerce
- Business partner registration
- Partner approval workflow
- Wholesale pricing
- Customer-specific pricing
- Minimum order quantities
- Case and package ordering
- Volume discounts
- Quick ordering by SKU
- Repeat previous orders
- Quotation requests

### Inventory
- Centralized inventory management
- Warehouse support
- Stock movement records
- Product availability status
- Server-side stock validation
- Overselling prevention

### Administration
- Product management
- Category and brand management
- Order management
- Customer management
- Partner management
- Pricing and discount management
- Banner and content management
- Shipping configuration
- Reports and analytics
- Admin accounts and role permissions
- Security and audit logs

### Android Management Application
- Website connection setup
- Central management dashboard
- Product and inventory control
- Order processing
- Customer and partner management
- Content and appearance management
- Reports and notifications
- Role-based administration

## Technology Architecture

| Component | Technology |
|---|---|
| Storefront | Next.js |
| Language | TypeScript |
| Backend | Django |
| API | Django REST Framework |
| Database | PostgreSQL |
| Cache | Redis |
| Background Jobs | Celery |
| Android App | Java |
| Hosting | Render |
| Version Control | GitHub |

## Repository Structure

```text
jalali-cosmetics/
├── apps/
│   ├── storefront/
│   └── admin-mobile/
├── backend/
│   ├── config/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── customers/
│   │   ├── partners/
│   │   ├── catalog/
│   │   ├── pricing/
│   │   ├── inventory/
│   │   ├── warehouses/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── shipping/
│   │   ├── notifications/
│   │   ├── content/
│   │   ├── analytics/
│   │   ├── audit/
│   │   └── settings/
│   └── manage.py
├── infrastructure/
├── docs/
├── scripts/
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── README.md
