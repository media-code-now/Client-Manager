# Payment Integration - Stripe & Square

## Overview
The Payment Integration feature allows users to connect their Stripe or Square accounts to process invoices and accept payments directly within the CRM. This integration enables seamless financial operations, automated invoice tracking, and comprehensive payment reporting.

## Supported Providers

### Stripe
- **Features:**
  - Invoice processing and tracking
  - One-time and recurring payments
  - Subscription management
  - Payment method storage
  - Automated payment reminders
  - Refund processing
  - Detailed financial reports
  - Webhook support for real-time updates

- **API Integration:**
  - OAuth 2.0 authentication
  - Stripe API v2023-10-16 or later
  - Payment Intents API
  - Customer Portal integration
  - Invoice API

- **Data Sync:**
  - Customers ↔ CRM Clients
  - Invoices ↔ CRM Invoices
  - Payments ↔ Transaction records
  - Subscriptions ↔ Recurring services

### Square
- **Features:**
  - Point of Sale integration
  - Online payment processing
  - Invoice creation and tracking
  - Payment link generation
  - Customer management
  - Inventory sync (optional)
  - Financial reporting
  - Real-time payment notifications

- **API Integration:**
  - OAuth 2.0 authentication
  - Square API v2.0
  - Payments API
  - Invoices API
  - Customer API

- **Data Sync:**
  - Customers ↔ CRM Clients
  - Invoices ↔ CRM Invoices
  - Payments ↔ Transaction records
  - Locations ↔ Business locations

## Database Schema

### Integration Record
```sql
INSERT INTO integrations (user_id, type, name, status, config, credentials) VALUES (
  1,
  'payments',
  'Stripe',
  'active',
  '{"auto_sync": true, "sync_invoices": true, "sync_payments": true, "webhook_enabled": true}'::jsonb,
  '{"access_token": "encrypted_token", "refresh_token": "encrypted_token", "account_id": "acct_xxx"}'::jsonb
);
```

### Webhook Configuration
```sql
INSERT INTO webhooks (integration_id, url, secret, events) VALUES (
  1,
  'https://yourapp.com/api/webhooks/stripe',
  'whsec_xxxxxxxxxxxxx',
  '["invoice.paid", "invoice.payment_failed", "customer.created", "payment_intent.succeeded"]'::jsonb
);
```

### Synced Data Storage
```sql
INSERT INTO integration_data (integration_id, data_type, external_id, data) VALUES (
  1,
  'invoice',
  'in_xxxxxxxxxx',
  '{"amount": 10000, "currency": "usd", "status": "paid", "customer_id": "cus_xxx"}'::jsonb
);
```

## UI Features

### Integration Card
- **Card Display:**
  - Icon: 💳
  - Color: Green gradient (from-green-500 to-green-600)
  - Title: "Payments"
  - Description: "Process invoices and accept payments from clients"
  - Status: Connected/Not Connected

- **Features List:**
  - Invoice Processing
  - Payment Tracking
  - Recurring Billing
  - Financial Reports

### Provider Selection
When users click "Connect Payments", they see:
1. **Stripe Option**
   - Icon: 💳
   - Click → OAuth flow to Stripe
   - Permissions: Read/Write invoices, customers, payments

2. **Square Option**
   - Icon: ⬛
   - Click → OAuth flow to Square
   - Permissions: Read/Write payments, customers, invoices

### Connection Flow
1. User clicks provider (Stripe or Square)
2. Redirect to provider OAuth page
3. User authorizes access
4. Callback with authorization code
5. Exchange code for access token
6. Store encrypted credentials in database
7. Initialize webhook endpoints
8. Start initial data sync
9. Show success message with sync status

## API Endpoints (To Be Implemented)

### Connect Payment Provider
```typescript
POST /api/integrations/payments/connect
Body: {
  provider: 'stripe' | 'square',
  redirect_uri: string
}
Response: {
  authorization_url: string
}
```

### OAuth Callback
```typescript
GET /api/integrations/payments/callback
Query: {
  code: string,
  state: string,
  provider: 'stripe' | 'square'
}
Response: {
  success: boolean,
  integration_id: number
}
```

### Sync Invoices
```typescript
POST /api/integrations/payments/{id}/sync-invoices
Response: {
  synced: number,
  updated: number,
  errors: string[]
}
```

### Create Invoice (in provider)
```typescript
POST /api/integrations/payments/{id}/create-invoice
Body: {
  client_id: number,
  amount: number,
  currency: string,
  due_date: string,
  items: Array<{
    description: string,
    amount: number
  }>
}
Response: {
  invoice_id: string,
  url: string
}
```

### Process Payment
```typescript
POST /api/integrations/payments/{id}/process-payment
Body: {
  invoice_id: string,
  payment_method_id: string,
  amount: number
}
Response: {
  payment_id: string,
  status: 'succeeded' | 'failed',
  receipt_url: string
}
```

## Webhook Handlers

### Stripe Webhooks
```typescript
POST /api/webhooks/stripe
Headers: {
  'stripe-signature': string
}
Body: Stripe Event Object

Supported Events:
- invoice.paid → Update invoice status, create payment record
- invoice.payment_failed → Update invoice status, trigger notification
- customer.created → Sync customer to CRM
- customer.updated → Update client details
- payment_intent.succeeded → Record successful payment
- charge.refunded → Record refund, update balances
```

### Square Webhooks
```typescript
POST /api/webhooks/square
Headers: {
  'x-square-signature': string
}
Body: Square Event Object

Supported Events:
- invoice.paid → Update invoice status
- invoice.canceled → Update invoice status
- payment.created → Record payment
- payment.updated → Update payment status
- customer.created → Sync customer
- customer.updated → Update client
```

## Data Synchronization

### Initial Sync
When a payment provider is first connected:
1. Fetch all customers → Map to CRM clients
2. Fetch recent invoices (last 90 days) → Create/update CRM invoices
3. Fetch payment history → Record transactions
4. Enable webhooks for real-time updates

### Ongoing Sync
- **Real-time:** Via webhooks for immediate updates
- **Scheduled:** Hourly sync for missed webhook events
- **Manual:** User-triggered sync button

### Sync Direction
- **Bidirectional:**
  - Customers/Clients (both ways)
  - Invoices (both ways)
  
- **From Provider to CRM:**
  - Payment records
  - Subscription status
  - Refunds
  
- **From CRM to Provider:**
  - New invoice creation
  - Payment requests
  - Customer updates

## Security Considerations

### Credential Storage
- All access tokens encrypted at rest
- Use AES-256-GCM encryption
- Store encryption keys in environment variables
- Never log or expose credentials

### Webhook Verification
```typescript
// Stripe
const signature = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);

// Square
const signature = request.headers['x-square-signature'];
const isValid = square.webhooks.verifySignature(
  request.body,
  signature,
  process.env.SQUARE_WEBHOOK_SECRET
);
```

### PCI Compliance
- Never store raw credit card numbers
- Use provider's tokenization
- Redirect payment forms to provider-hosted pages
- Store only payment tokens and metadata

## Financial Reporting

### Dashboard Metrics
- Total revenue (current month)
- Outstanding invoices
- Payment success rate
- Average invoice value
- Top paying clients
- Revenue by service type

### Reports
- **Revenue Report:** Daily/Weekly/Monthly revenue breakdown
- **Invoice Report:** Invoice status, aging, overdue amounts
- **Payment Report:** Payment methods, transaction fees, net revenue
- **Client Report:** Payment history per client, outstanding balances

## Error Handling

### Common Errors
- **OAuth Failure:** Show error, allow retry
- **Webhook Signature Mismatch:** Log error, reject request
- **Payment Failed:** Update status, notify client
- **Sync Error:** Log error, schedule retry
- **API Rate Limit:** Queue requests, implement backoff

### Retry Logic
- Exponential backoff for API calls
- Max 3 retries for failed operations
- Manual retry option for users
- Error notifications for critical failures

## Testing

### Test Accounts
- **Stripe:** Use test API keys from Stripe dashboard
- **Square:** Use Square Sandbox environment

### Test Scenarios
1. Connect payment provider
2. Create test invoice
3. Process test payment
4. Receive webhook event
5. Sync data
6. Disconnect provider
7. Reconnect with different account

### Test Cards (Stripe)
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155

## Future Enhancements
- PayPal integration
- Apple Pay / Google Pay
- Multi-currency support
- Automated dunning for failed payments
- Payment plans and installments
- Dispute management
- Advanced fraud detection
- Custom payment forms
- Embedded checkout
- Mobile payment links

## Resources

### Stripe
- API Documentation: https://stripe.com/docs/api
- OAuth Guide: https://stripe.com/docs/connect/oauth
- Webhook Guide: https://stripe.com/docs/webhooks

### Square
- API Documentation: https://developer.squareup.com/reference/square
- OAuth Guide: https://developer.squareup.com/docs/oauth-api/overview
- Webhook Guide: https://developer.squareup.com/docs/webhooks/overview
