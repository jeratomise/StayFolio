# Promo Code Redemption System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin to create promo codes that grant users 3-month free PRO subscriptions, with single/multi-use support, expiry dates, and admin disable capability.

**Architecture:** Two new Supabase tables (`promo_codes`, `promo_redemptions`) store codes and track usage. A new `services/promoCodes.ts` service handles all promo logic (CRUD, validation, redemption). Admin gets a code management tab in `AdminUserList`. Users get a "Redeem Code" section in `ProfileView`. Auth signup gets an optional promo code field. On Pro expiry, the app shows a notification banner before downgrading.

**Tech Stack:** React 19, TypeScript, Supabase (Postgres + RLS), Tailwind CSS (CDN)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `migrations/002_promo_codes.sql` | Create | SQL migration: `promo_codes` and `promo_redemptions` tables with RLS |
| `types.ts` | Modify | Add `PromoCode` and `PromoRedemption` interfaces |
| `services/promoCodes.ts` | Create | All promo code logic: admin CRUD, validate, redeem, list redemptions |
| `components/AdminPromoManager.tsx` | Create | Admin UI: create codes, view list, toggle active/disabled, view redemptions |
| `components/AdminUserList.tsx` | Modify | Add tab/section to navigate to promo management |
| `components/RedeemCodeSection.tsx` | Create | User-facing "Redeem a Code" card with input + submit |
| `components/ProfileView.tsx` | Modify | Insert `RedeemCodeSection` between subscription and data sections |
| `components/Auth.tsx` | Modify | Add optional promo code field on signup form |
| `components/ProExpiryBanner.tsx` | Create | Banner warning user their Pro trial is expiring soon |
| `App.tsx` | Modify | Wire up expiry banner, refresh subscription after redemption |

---

### Task 1: Supabase Migration — Create Tables

**Files:**
- Create: `migrations/002_promo_codes.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Promo codes table
create table promo_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  description text default '',
  grant_days  int not null default 90,
  is_single_use boolean not null default true,
  max_uses    int default null,            -- null = unlimited (for multi-use)
  times_used  int not null default 0,
  is_active   boolean not null default true,
  expires_at  timestamptz default null,    -- null = never expires
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- Redemption log
create table promo_redemptions (
  id          uuid primary key default gen_random_uuid(),
  code_id     uuid not null references promo_codes(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz default now(),
  unique (code_id, user_id)              -- one redemption per user per code
);

-- RLS
alter table promo_codes enable row level security;
alter table promo_redemptions enable row level security;

-- Admin (jeratomise@gmail.com) can manage all promo codes
create policy "Admin manages promo codes"
  on promo_codes for all
  using (auth.jwt() ->> 'email' = 'jeratomise@gmail.com');

-- Users can read active promo codes (needed for validation)
create policy "Users can read active codes"
  on promo_codes for select
  using (is_active = true);

-- Users can increment times_used when redeeming
create policy "Users can update usage count"
  on promo_codes for update
  using (is_active = true)
  with check (is_active = true);

-- Admin can read all redemptions
create policy "Admin reads all redemptions"
  on promo_redemptions for all
  using (auth.jwt() ->> 'email' = 'jeratomise@gmail.com');

-- Users can read and insert their own redemptions
create policy "Users manage own redemptions"
  on promo_redemptions for select
  using (auth.uid() = user_id);

create policy "Users can redeem codes"
  on promo_redemptions for insert
  with check (auth.uid() = user_id);

-- Indexes
create index idx_promo_codes_code on promo_codes(code);
create index idx_promo_codes_active on promo_codes(is_active);
create index idx_promo_redemptions_user on promo_redemptions(user_id);
create index idx_promo_redemptions_code on promo_redemptions(code_id);
```

- [ ] **Step 2: Run migration in Supabase**

Execute the SQL via Supabase dashboard SQL editor or MCP tool `execute_sql`.

- [ ] **Step 3: Verify tables exist**

Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'promo%';`
Expected: `promo_codes`, `promo_redemptions`

---

### Task 2: TypeScript Types

**Files:**
- Modify: `types.ts:73` (after Subscription interface)

- [ ] **Step 1: Add PromoCode and PromoRedemption types**

Append after the `Subscription` interface (line 73):

```typescript
export interface PromoCode {
  id: string;
  code: string;
  description: string;
  grantDays: number;
  isSingleUse: boolean;
  maxUses: number | null;
  timesUsed: number;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface PromoRedemption {
  id: string;
  codeId: string;
  userId: string;
  redeemedAt: string;
  // Joined fields (optional, for admin view)
  code?: string;
  userEmail?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add types.ts
git commit -m "feat: add PromoCode and PromoRedemption types"
```

---

### Task 3: Promo Code Service

**Files:**
- Create: `services/promoCodes.ts`

- [ ] **Step 1: Create the service with all promo code functions**

```typescript
import { supabase } from './supabase';
import { PromoCode, PromoRedemption } from '../types';

// --- Mapping helpers (snake_case ↔ camelCase) ---

const mapPromoCodeFromDb = (row: any): PromoCode => ({
  id: row.id,
  code: row.code,
  description: row.description || '',
  grantDays: row.grant_days,
  isSingleUse: row.is_single_use,
  maxUses: row.max_uses,
  timesUsed: row.times_used,
  isActive: row.is_active,
  expiresAt: row.expires_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

// --- Admin Functions ---

export const createPromoCode = async (params: {
  code: string;
  description?: string;
  grantDays?: number;
  isSingleUse: boolean;
  maxUses?: number | null;
  expiresAt?: string | null;
}): Promise<PromoCode | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code: params.code.toUpperCase().trim(),
      description: params.description || '',
      grant_days: params.grantDays ?? 90,
      is_single_use: params.isSingleUse,
      max_uses: params.isSingleUse ? 1 : (params.maxUses ?? null),
      is_active: true,
      expires_at: params.expiresAt || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating promo code:', error);
    return null;
  }
  return mapPromoCodeFromDb(data);
};

export const getAllPromoCodes = async (): Promise<PromoCode[]> => {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching promo codes:', error);
    return [];
  }
  return (data || []).map(mapPromoCodeFromDb);
};

export const togglePromoCodeActive = async (id: string, isActive: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('promo_codes')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) {
    console.error('Error toggling promo code:', error);
    return false;
  }
  return true;
};

export const getRedemptionsForCode = async (codeId: string): Promise<PromoRedemption[]> => {
  const { data, error } = await supabase
    .from('promo_redemptions')
    .select('*, promo_codes(code)')
    .eq('code_id', codeId)
    .order('redeemed_at', { ascending: false });

  if (error) {
    console.error('Error fetching redemptions:', error);
    return [];
  }
  return (data || []).map((r: any) => ({
    id: r.id,
    codeId: r.code_id,
    userId: r.user_id,
    redeemedAt: r.redeemed_at,
    code: r.promo_codes?.code,
  }));
};

// --- User Functions ---

export const redeemPromoCode = async (codeString: string): Promise<{
  success: boolean;
  error?: string;
  grantDays?: number;
  newExpiresAt?: string;
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  // 1. Check if user is already a paid Pro user (via Stripe)
  const { data: subData } = await supabase
    .from('user_subscriptions')
    .select('status, stripe_customer_id, expires_at')
    .eq('user_id', user.id)
    .single();

  if (subData?.status === 'pro' && subData?.stripe_customer_id) {
    return { success: false, error: 'You already have an active paid Pro subscription.' };
  }

  // 2. Look up the code
  const { data: codeData, error: codeLookupError } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', codeString.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (codeLookupError || !codeData) {
    return { success: false, error: 'Invalid or expired promo code.' };
  }

  // 3. Check expiry
  if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
    return { success: false, error: 'This promo code has expired.' };
  }

  // 4. Check usage limits
  if (codeData.is_single_use && codeData.times_used >= 1) {
    return { success: false, error: 'This code has already been used.' };
  }
  if (codeData.max_uses !== null && codeData.times_used >= codeData.max_uses) {
    return { success: false, error: 'This code has reached its maximum number of uses.' };
  }

  // 5. Check if this user already redeemed this code
  const { data: existingRedemption } = await supabase
    .from('promo_redemptions')
    .select('id')
    .eq('code_id', codeData.id)
    .eq('user_id', user.id)
    .single();

  if (existingRedemption) {
    return { success: false, error: 'You have already redeemed this code.' };
  }

  // 6. Calculate new expiry (extend from current expiry if already pro, else from now)
  let baseDate = new Date();
  if (subData?.status === 'pro') {
    // Extend existing pro period if not expired
    const currentExpiry = subData.expires_at ? new Date(subData.expires_at) : null;
    if (currentExpiry && currentExpiry > baseDate) {
      baseDate = currentExpiry;
    }
  }
  const newExpiry = new Date(baseDate);
  newExpiry.setDate(newExpiry.getDate() + codeData.grant_days);
  const newExpiresAt = newExpiry.toISOString();

  // 7. Record redemption
  const { error: redemptionError } = await supabase
    .from('promo_redemptions')
    .insert({
      code_id: codeData.id,
      user_id: user.id,
    });

  if (redemptionError) {
    console.error('Redemption insert failed:', redemptionError);
    return { success: false, error: 'Failed to redeem code. Please try again.' };
  }

  // 8. Increment times_used on the promo code
  await supabase
    .from('promo_codes')
    .update({ times_used: codeData.times_used + 1 })
    .eq('id', codeData.id);

  // 9. Update user subscription to pro
  const { error: subError } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'pro',
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (subError) {
    console.error('Subscription update failed:', subError);
    return { success: false, error: 'Code redeemed but failed to activate Pro. Contact support.' };
  }

  return {
    success: true,
    grantDays: codeData.grant_days,
    newExpiresAt,
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add services/promoCodes.ts
git commit -m "feat: add promo code service with admin CRUD and user redemption"
```

---

### Task 4: Admin Promo Code Manager UI

**Files:**
- Create: `components/AdminPromoManager.tsx`

- [ ] **Step 1: Create the admin promo management component**

This component should include:
- A "Create New Code" form at the top with fields: code (text), description (text), grant days (number, default 90), single-use toggle, max uses (number, shown when not single-use), expiry date (date picker, optional)
- A table listing all promo codes showing: code, description, type (single/multi), usage count vs max, status (active/disabled), expiry, created date
- Toggle button per row to enable/disable a code
- Expandable row or modal showing redemption log per code (who redeemed, when)

UI style: Match existing `AdminUserList.tsx` patterns — white card with table, slate-900 modal headers, indigo accent colors, same font sizes and spacing.

Key imports: `createPromoCode`, `getAllPromoCodes`, `togglePromoCodeActive`, `getRedemptionsForCode` from `services/promoCodes.ts`.

State: `codes: PromoCode[]`, `loading: boolean`, `showCreateForm: boolean`, form field states, `expandedCodeId: string | null` for viewing redemptions.

- [ ] **Step 2: Commit**

```bash
git add components/AdminPromoManager.tsx
git commit -m "feat: add admin promo code management UI"
```

---

### Task 5: Wire Admin Promo Manager into Admin View

**Files:**
- Modify: `components/AdminUserList.tsx:1-4` (imports)
- Modify: `components/AdminUserList.tsx:82-83` (add tab navigation)
- Modify: `App.tsx` (add `admin_promos` view mode if using separate view, OR embed tabs within AdminUserList)

- [ ] **Step 1: Add tab navigation within AdminUserList**

The simplest approach: add a tab bar at the top of `AdminUserList` with two tabs — "Users" and "Promo Codes". When "Promo Codes" tab is selected, render `<AdminPromoManager />` instead of the users table.

Add to imports:
```typescript
import { AdminPromoManager } from './AdminPromoManager';
import { Ticket } from 'lucide-react';
```

Add state:
```typescript
const [activeTab, setActiveTab] = useState<'users' | 'promos'>('users');
```

Add tab bar after the header card (line 109), before the loading/table section:
```tsx
<div className="flex gap-2 bg-white rounded-xl border border-slate-100 p-1 shadow-sm">
  <button
    onClick={() => setActiveTab('users')}
    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
      activeTab === 'users' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
    }`}
  >
    <Users size={16} /> Users
  </button>
  <button
    onClick={() => setActiveTab('promos')}
    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
      activeTab === 'promos' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
    }`}
  >
    <Ticket size={16} /> Promo Codes
  </button>
</div>
```

Wrap the existing users table + edit modal in `{activeTab === 'users' && ( ... )}`.
Add `{activeTab === 'promos' && <AdminPromoManager />}`.

- [ ] **Step 2: Commit**

```bash
git add components/AdminUserList.tsx
git commit -m "feat: add promo codes tab to admin panel"
```

---

### Task 6: Redeem Code Section for Profile View

**Files:**
- Create: `components/RedeemCodeSection.tsx`

- [ ] **Step 1: Create the redeem code component**

Props: `isPro: boolean`, `hasStripeSubscription: boolean`, `onRedeemed: () => void`

UI:
- A card matching ProfileView style (white bg, rounded-2xl, border, p-6)
- Icon: `Ticket` from lucide-react, purple accent
- Title: "Redeem a Code"
- Text input for code entry (uppercase auto-format)
- "Redeem" button (indigo/purple gradient)
- States: idle, loading (spinner), success (green check + "Pro activated until {date}"), error (red message)
- If user is already paid Pro (`hasStripeSubscription`), show disabled state: "You already have an active Pro subscription."

Calls `redeemPromoCode()` from `services/promoCodes.ts`. On success, calls `onRedeemed()` to refresh subscription state in parent.

- [ ] **Step 2: Commit**

```bash
git add components/RedeemCodeSection.tsx
git commit -m "feat: add redeem promo code component"
```

---

### Task 7: Add Redeem Section to ProfileView

**Files:**
- Modify: `components/ProfileView.tsx:1-4` (imports)
- Modify: `components/ProfileView.tsx:142-143` (insert between subscription and grid sections)

- [ ] **Step 1: Import and wire up RedeemCodeSection**

Add import:
```typescript
import { RedeemCodeSection } from './RedeemCodeSection';
```

Update props interface to include `onRedeemed: () => void` and `hasStripeSubscription: boolean`.

Insert `<RedeemCodeSection>` after the subscription card (line 142) and before the grid (line 144):
```tsx
<RedeemCodeSection
  isPro={isPro}
  hasStripeSubscription={!!subscription?.stripeCustomerId}
  onRedeemed={onRedeemed}
/>
```

- [ ] **Step 2: Update App.tsx to pass new props**

In `App.tsx` where `<ProfileView>` is rendered, add the new props:
```tsx
<ProfileView
  user={session.user}
  onOpenDataModal={() => setIsDataModalOpen(true)}
  isPro={isPro}
  onTogglePro={handleUpgrade}
  hasStripeSubscription={!!subscription?.stripeCustomerId}
  onRedeemed={fetchSubscription}
/>
```

- [ ] **Step 3: Commit**

```bash
git add components/ProfileView.tsx App.tsx
git commit -m "feat: add promo code redemption to profile view"
```

---

### Task 8: Add Promo Code Field to Signup

**Files:**
- Modify: `components/Auth.tsx`

- [ ] **Step 1: Add optional promo code field to signup form**

Add state:
```typescript
const [promoCode, setPromoCode] = useState('');
```

In the signup form section (only visible when `mode === 'signup'`), add an optional field after the password input:
```tsx
{mode === 'signup' && (
  <div className="relative">
    <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      value={promoCode}
      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
      placeholder="Promo Code (optional)"
      className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
    />
  </div>
)}
```

Add `Ticket` to the lucide imports.

- [ ] **Step 2: Apply promo code after successful signup + first login**

The promo code cannot be applied at signup time because the user doesn't have a session yet (they need to verify email first). Instead:

- Store the promo code in `localStorage` after successful signup: `localStorage.setItem('stayfolio_pending_promo', promoCode)`
- In `App.tsx`, after `syncUserRegistry()` succeeds on login, check for pending promo:

```typescript
// In the useEffect where syncUserRegistry is called (App.tsx ~line 224)
syncUserRegistry().then(async (sub) => {
  if (sub) setSubscription(sub);
  // Check for pending promo code from signup
  const pendingPromo = localStorage.getItem('stayfolio_pending_promo');
  if (pendingPromo) {
    localStorage.removeItem('stayfolio_pending_promo');
    const { redeemPromoCode } = await import('./services/promoCodes');
    const result = await redeemPromoCode(pendingPromo);
    if (result.success) {
      fetchSubscription(); // Refresh to pick up new pro status
    }
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add components/Auth.tsx App.tsx
git commit -m "feat: add optional promo code field to signup with deferred redemption"
```

---

### Task 9: Pro Expiry Notification Banner

**Files:**
- Create: `components/ProExpiryBanner.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: Create the expiry banner component**

Props: `expiresAt: string`, `onDismiss: () => void`

Logic:
- Calculate days remaining from `expiresAt`
- Show banner only when <= 7 days remaining
- If expired (days <= 0): red banner — "Your Pro access has expired. Redeem a code or upgrade to continue."
- If expiring soon (1-7 days): amber banner — "Your Pro access expires in {N} days."
- Dismiss button (stores dismissal in sessionStorage so it doesn't nag every page)

```tsx
import React from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';

interface ProExpiryBannerProps {
  expiresAt: string;
  onDismiss: () => void;
}

export const ProExpiryBanner: React.FC<ProExpiryBannerProps> = ({ expiresAt, onDismiss }) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft > 7) return null;

  const isExpired = daysLeft <= 0;

  return (
    <div className={`rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-medium ${
      isExpired
        ? 'bg-rose-50 border border-rose-200 text-rose-700'
        : 'bg-amber-50 border border-amber-200 text-amber-700'
    }`}>
      {isExpired ? <AlertTriangle size={16} className="shrink-0" /> : <Clock size={16} className="shrink-0" />}
      <span className="flex-1">
        {isExpired
          ? 'Your Pro access has expired. Redeem a new code or upgrade to continue enjoying Pro features.'
          : `Your Pro access expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Redeem a code to extend.`
        }
      </span>
      <button onClick={onDismiss} className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0">
        <X size={14} />
      </button>
    </div>
  );
};
```

- [ ] **Step 2: Wire banner into App.tsx**

Add state:
```typescript
const [expiryBannerDismissed, setExpiryBannerDismissed] = useState(false);
```

Render the banner at the top of the main content area (after nav renders, before view content), only when:
- User has a promo-based Pro subscription (has `expiresAt`, no `stripeCustomerId`)
- Banner not dismissed this session

```tsx
{subscription?.expiresAt && !subscription?.stripeCustomerId && !expiryBannerDismissed && (
  <ProExpiryBanner
    expiresAt={subscription.expiresAt}
    onDismiss={() => setExpiryBannerDismissed(true)}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add components/ProExpiryBanner.tsx App.tsx
git commit -m "feat: add Pro expiry notification banner"
```

---

### Task 10: End-to-End Testing & Deploy

- [ ] **Step 1: Test admin flow**
1. Log in as admin (jeratomise@gmail.com)
2. Navigate to Admin > Promo Codes tab
3. Create a single-use code: `TEST90` with 90 grant days
4. Create a multi-use code: `LAUNCH2026` with max 50 uses, expiry 2026-06-30
5. Verify both appear in the list with correct metadata
6. Disable `TEST90`, verify it shows as disabled

- [ ] **Step 2: Test user redemption flow**
1. Log in as a test free user
2. Go to Profile > Redeem a Code
3. Enter `LAUNCH2026` → should succeed, show confirmation with new expiry date
4. Verify profile now shows PRO status
5. Try redeeming `LAUNCH2026` again → should show "already redeemed"
6. Try redeeming `TEST90` (disabled) → should show "invalid or expired"

- [ ] **Step 3: Test signup with promo code**
1. Sign up with a new email, enter `LAUNCH2026` in promo field
2. Verify email, log in
3. Verify Pro status is automatically applied

- [ ] **Step 4: Test expiry banner**
1. As admin, set a test user's `expires_at` to 3 days from now
2. Log in as that user → should see amber warning banner
3. Set `expires_at` to yesterday → should see red expired banner

- [ ] **Step 5: Deploy to Vercel**

```bash
vercel --prod
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete promo code system with admin management, user redemption, signup integration, and expiry notifications"
```
