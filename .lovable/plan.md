

## Arena Control - Full SaaS Implementation Plan

### Current State
- All 7 pages use hardcoded mock data, zero Supabase integration
- Pages Pagamentos, Relatórios, Configurações, Minha Conta are empty placeholders
- No authentication, no database, no RLS, no Supabase client
- Design is complete and must be preserved exactly

### Pre-requisite: Enable Lovable Cloud
Must enable Cloud first to provision the Supabase backend.

---

### Phase 1: Database Schema & Security

**7 tables via migrations:**

```text
arenas (id, nome, telefone, email, endereco, cidade, estado, slug, created_at)
quadras (id, arena_id FK, nome, tipo_esporte, preco_hora, ativa, created_at)
clientes (id, arena_id FK, nome, telefone, email, observacoes, created_at)
reservas (id, arena_id FK, quadra_id FK, cliente_id FK, data, hora_inicio, hora_fim, valor, status, origem, observacoes, created_at)
pagamentos (id, arena_id FK, reserva_id FK, valor, metodo, status, transaction_id, created_at)
configuracoes_arena (id, arena_id FK, horario_abertura, horario_fechamento, tempo_minimo_reserva, intervalo_reserva, permitir_reserva_online, link_publico_ativo, mensagem_confirmacao)
profiles (id, user_id FK auth.users, arena_id FK, name, created_at)
```

- RLS on all tables: `arena_id` based isolation (multi-tenant)
- `profiles` links `auth.users` to an `arena`
- Security definer function `get_user_arena_id(uuid)` to avoid RLS recursion
- Trigger: auto-create profile + arena on signup
- Unique constraint: `(quadra_id, data, hora_inicio)` on reservas
- Unique constraint: `(arena_id, telefone)` on clientes
- `slug` unique on arenas

---

### Phase 2: Auth + Supabase Client

**New files:**
- `src/integrations/supabase/client.ts` - Supabase client init
- `src/hooks/useAuth.tsx` - Auth context with `onAuthStateChange` + `getSession`
- `src/pages/Auth.tsx` - Login/Signup/Forgot password form (preserving design language)
- `src/pages/ResetPassword.tsx` - Password reset page
- `src/pages/MinhaConta.tsx` - Edit name, change password, logout

**Modifications:**
- `App.tsx` - Wrap with AuthProvider, protect routes, add `/auth` and `/reset-password` routes
- `Layout.tsx` - Show user initials from profile, logout on avatar click

---

### Phase 3: Data Hooks (React Query)

**New files in `src/hooks/`:**
- `useArena.ts` - Get current user's arena, update arena settings
- `useQuadras.ts` - CRUD for courts, filtered by arena_id
- `useClientes.ts` - List, create, update clients (phone uniqueness validation)
- `useReservas.ts` - List, create, update, cancel reservations (time conflict check before insert)
- `usePagamentos.ts` - List, create payments (auto-update reservation status when fully paid)
- `useConfiguracoes.ts` - Get/update arena config
- `useDashboardStats.ts` - Aggregate queries for KPIs

All hooks use `async/await`, `try/catch`, toast feedback, and React Query invalidation.

---

### Phase 4: Wire Existing Pages to Real Data

1. **NovaReserva.tsx** - Replace static form with controlled state, zod validation, conflict check query, insert mutation, success toast + redirect. Load courts and clients from DB. Auto-create client if new phone.

2. **Reservas.tsx** - Fetch from `reservas` joined with `clientes` + `quadras`. Keep existing table design, search, filters.

3. **Agenda.tsx** - Fetch reservas for selected week, render in existing grid. Week navigation functional. Court filter from DB.

4. **Clientes.tsx** - Fetch from DB. Wire "Adicionar" button to dialog with form (name + phone required). Summary cards from real aggregates.

5. **Index.tsx (Dashboard)** - KPIs from real aggregate queries. Upcoming reservations from DB. Alerts from real conditions.

6. **Financeiro.tsx** - Fetch payments + reservations. Real totals. Period filter functional. CSV export button.

---

### Phase 5: New Pages (currently placeholders)

1. **Pagamentos.tsx** (`/pagamentos`)
   - List payments joined with reservas + clientes
   - Filters: date range, status, method
   - Total sum card at top
   - "Novo Pagamento" dialog: select reservation, amount, method
   - Auto-update reservation status when paid >= total
   - Preserve existing card/list design language

2. **Relatórios.tsx** (`/relatorios`)
   - Monthly revenue, total reservations, occupancy rate
   - Per-court breakdown table
   - Per-client breakdown table
   - CSV export functional
   - Use recharts (already installed) for charts

3. **Configurações.tsx** (`/configuracoes`)
   - Arena settings form: nome, telefone, endereco, cidade, horarios
   - Default hourly rate, tempo minimo, intervalo
   - Toggle: permitir reserva online
   - Show public booking link with copy button
   - Courts CRUD: add/edit/delete courts in cards

4. **MinhaConta.tsx** (`/conta`)
   - Display user email, name
   - Edit name form
   - Change password form
   - Logout button

---

### Phase 6: Public Booking Page

**New files:**
- `src/pages/PublicBooking.tsx` - Public page at `/arena/:slug/reservar`

**Features:**
- No auth required (public route)
- Fetch arena by slug, show name + address
- Show available courts
- Calendar date picker
- Available time slots (respecting existing reservations + arena hours)
- Booking form: nome, telefone, email
- On confirm: auto-create client, create reservation with `status=pendente`, `origem=link_publico`
- Confirmation screen with payment placeholder

**Route addition in App.tsx:**
- `/arena/:slug/reservar` → PublicBooking (outside auth protection)

---

### Phase 7: Business Rules (enforced across all mutations)

- Time conflict: query overlapping reservations before insert
- Arena hours: validate against `configuracoes_arena`
- Minimum booking time: validate `hora_fim - hora_inicio >= tempo_minimo`
- Interval between bookings: validate gap from adjacent reservations
- Phone uniqueness per arena for clients
- Payment cannot exceed remaining balance
- All forms validate required fields with zod
- React Query invalidation on all related queries after mutations

---

### Estimated Changes
- ~5 database migrations
- ~8 new files (pages + hooks + auth)
- ~8 modified files (existing pages + App.tsx + Layout.tsx)
- 1 new public route

### Implementation Order
1. Enable Cloud → 2. Migrations → 3. Auth → 4. Hooks → 5. Wire existing pages → 6. New pages → 7. Public booking

