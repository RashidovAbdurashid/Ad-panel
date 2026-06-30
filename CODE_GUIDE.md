# Atlas Admin — Code Guide

This document walks through every file in the project and explains what it
does, how it works, and how it connects to the rest of the app. It's meant
to be read alongside the source code — file paths are given as headings so
you can jump straight to the matching file.

For setup instructions, see `README.md`. This file is about *how the code
works*, not how to run it.

---

## 1. How the app boots up

### `index.html`
The single HTML page Vite serves. It has one empty `<div id="root">` and a
`<script type="module" src="/src/main.jsx">` tag. Everything else is
rendered by React into that div — this is a single-page app (SPA), so there
are no other `.html` files; React Router handles "pages" entirely on the
client.

### `src/main.jsx`
The actual entry point. It does three things:
1. Finds the `#root` div.
2. Creates a React root with `createRoot`.
3. Renders `<App />` inside `<StrictMode>` (StrictMode just helps catch bugs
   in development — it renders components twice to surface side-effect
   mistakes; it has no effect in production).

### `src/App.jsx`
This is where routing and global providers are wired together. Reading it
top to bottom:

```jsx
<AuthProvider>          {/* makes login state available everywhere */}
  <BrowserRouter>        {/* enables client-side routing */}
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>      {/* gate everything below */}
        <Route element={<DashboardLayout />}>   {/* navbar + sidebar shell */}
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/carts" element={<CartList />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>

  <ToastContainer position="bottom-right" theme="dark" ... />
</AuthProvider>
```

Key ideas:
- **Nested routes**: `<ProtectedRoute>` and `<DashboardLayout>` each wrap
  child routes using React Router's `<Outlet />` pattern (explained below).
  A route nested inside `<ProtectedRoute>` only renders if the visitor is
  authenticated; a route nested inside `<DashboardLayout>` automatically
  gets the fixed navbar and sidebar around it.
- **Catch-all route** (`path="*"`) renders `NotFound` for any URL that
  doesn't match — this is what makes unknown URLs show the 404 page.
- **`ToastContainer`** is rendered once, outside the router, so toast
  notifications can pop up no matter which page is active. Any file can
  trigger one by calling `toast.success(...)`, `toast.error(...)`, etc.
  from `react-toastify`.

---

## 2. Authentication

### `src/context/AuthContext.jsx`
This is the single source of truth for "is someone logged in, and who are
they". It uses React's Context API instead of Redux because the app's auth
state is simple: a user object and a few functions.

How it works:
- `AuthProvider` wraps the whole app (see `App.jsx`). It holds two pieces of
  state: `user` and `isLoading`.
- On first mount (`useEffect` with an empty dependency array), it checks
  `localStorage` for a saved token and user. If both exist, it restores the
  session into `user` so a page refresh doesn't log you out. `isLoading`
  starts `true` and flips to `false` once that check finishes — this is
  what lets `ProtectedRoute` show a spinner instead of incorrectly bouncing
  a logged-in user to `/login` while `localStorage` is still being read.
- `login(username, password)` calls `loginRequest` (from
  `services/authService.js`), and on success stores a token and a small
  user object (`{ username }`) in both React state and `localStorage`, then
  shows a success toast. On failure it shows an error toast and returns
  `false` so the `Login` page knows not to redirect.
- `logout()` clears both `localStorage` keys, clears `user`, and shows an
  info toast.
- `useAuth()` is a small custom hook that any component can call to get
  `{ user, isAuthenticated, isLoading, login, logout }`. It throws an error
  if used outside `AuthProvider`, which protects against accidental misuse.

Why `localStorage` and not just React state: it makes the session persist
across page reloads and browser restarts, which is what the brief asked
for ("Store authentication state in Local Storage").

### `src/routes/ProtectedRoute.jsx`
A guard component used as a *parent* route in `App.jsx`. It doesn't render
any UI of its own (other than a loader) — it decides whether to let the
visitor through to the routes nested inside it.

```jsx
if (isLoading) return <Loader fullScreen label="Checking your session…" />;
if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
return <Outlet />;
```

`<Outlet />` is React Router's placeholder for "render whichever nested
route matched". So when you visit `/users`, React Router renders:
`ProtectedRoute` → (auth check passes) → `<Outlet>` → `DashboardLayout` →
`<Outlet>` → `Users`.

The `state={{ from: location }}` part remembers which page you were trying
to reach, so after a successful login you can be sent back there instead of
always landing on the home page (see `Login.jsx` below).

### `src/services/authService.js`
Two small functions that just call the API:
- `loginRequest(username, password)` — `POST /auth/login`. Fake Store API
  returns a token if the credentials match its seed data.
- `fetchCurrentUserProfile(userId = 1)` — `GET /users/:id`. Fake Store API
  has no "who am I" endpoint, so the Profile page just asks for a specific
  user (defaulting to id `1`) to have something realistic to display.

---

## 3. Talking to the API

### `src/services/api.js`
A single shared Axios instance, instead of every file calling `axios.get`
directly with a hardcoded URL. This is the standard "API client" pattern:

- `baseURL: 'https://fakestoreapi.com'` — every other service file calls
  relative paths like `/users` instead of repeating the full domain.
- A **request interceptor** automatically attaches
  `Authorization: Bearer <token>` if a token exists in `localStorage`, so
  individual requests never need to handle that manually.
- A **response interceptor** catches every error in one place and rewrites
  it into a plain `Error` with a readable `.message` — pulling from
  `error.response.data.message` if the API sent one, otherwise falling back
  to a generic "Something went wrong" string. This is why every `catch`
  block elsewhere in the app can just do `error.message` and show it in a
  toast, instead of digging through Axios's nested error shape each time.

### `src/services/userService.js` and `src/services/cartService.js`
Thin wrappers around `api` for each resource:

```js
getUsers()       // GET  /users
getUser(id)      // GET  /users/:id
createUser(p)    // POST /users
updateUser(id,p) // PUT  /users/:id
deleteUser(id)   // DELETE /users/:id
```

(`cartService.js` mirrors this exactly for `/carts`.) Keeping these in their
own files means the `Users` and `CartList` pages don't know or care about
HTTP — they just call `getUsers()` and get a promise of data. If the API
ever moved or changed its shape, only these two files would need to change.

**Important caveat repeated from the README**: Fake Store API is a mock
API. It accepts `POST`/`PUT`/`DELETE` and responds as if it worked, but
nothing is actually saved server-side. That's why the page components (see
`Users.jsx` / `CartList.jsx` below) update their *local* list of rows after
a successful call, rather than re-fetching from the server — re-fetching
would just bring back the original seed data.

---

## 4. Layout: the shell every dashboard page sits inside

### `src/layouts/DashboardLayout.jsx`
Rendered once, by the nested route in `App.jsx`, around every authenticated
page. It renders `Navbar`, `Sidebar`, and an `<Outlet />` for the current
page, plus a small bit of state (`sidebarOpen`) that's only relevant on
narrow screens:

```jsx
<Navbar onToggleSidebar={() => setSidebarOpen(v => !v)} />
<Sidebar isOpen={sidebarOpen} />
{sidebarOpen && <div className="dashboard-backdrop" onClick={() => setSidebarOpen(false)} />}
<main className="dashboard-content">
  <div className="dashboard-content-inner"><Outlet /></div>
</main>
```

On desktop, the sidebar is always visible (fixed via CSS) and
`sidebarOpen`/the backdrop are unused. Below 900px (see `Sidebar.css`), the
sidebar slides off-screen by default; the hamburger button in the navbar
toggles it open, and the semi-transparent backdrop lets you tap outside the
sidebar to close it again.

### `src/components/Navbar.jsx`
The fixed top bar. Three sections, left to right:
- **Left**: a hamburger button (mobile only) and the "Atlas Admin" brand
  mark/logo, which links back to `/`.
- **Center**: a single nav link to `/profile`, built from a tiny `navLinks`
  array (kept as an array, even with one entry, so it's trivial to add more
  links later — map over an array instead of hand-writing each `<NavLink>`).
  `NavLink` from React Router automatically adds an `--active` class when
  its `to` matches the current URL, which is how the Profile link gets
  highlighted in amber when you're on that page.
- **Right**: the logged-in user's avatar (initials, via `getInitials`) and
  username, pulled from `useAuth()`.

Logout isn't here — it lives in the sidebar (see below).

### `src/components/Sidebar.jsx`
The fixed left rail. It holds:
- A "Navigation" section with `Home`, `Users`, and `Cart List` links,
  generated from a `sidebarLinks` array the same way the navbar generates
  its links — each entry is `{ to, label, icon }`, mapped into `NavLink`s.
  The `Home` entry has `end: true`, which tells React Router to only treat
  it as active on an *exact* match to `/` — without it, `Home` would also
  light up while viewing `/users` or `/carts`, because `/` is technically a
  prefix of every path.
- A `sidebar-link-indicator` — an empty `<span>` per link that's invisible
  by default and turns into a small amber bar on the active link via CSS
  (`.sidebar-link--active .sidebar-link-indicator { background: var(--accent); }`).
- A **Logout button**, styled differently from the nav links (outlined,
  turns red on hover) so it doesn't get visually confused with navigation.
  It calls `logout()` from `useAuth()` directly.
- A footer pinned to the bottom of the sidebar (`margin-top: auto` on
  `.sidebar-footer`) showing a green "API connected" status dot and a
  version number — purely cosmetic, to make the shell feel like a real
  product.

---

## 5. Reusable building-block components

These live in `src/components/` and are used by multiple pages, so they're
documented once here rather than repeated under every page.

### `Button.jsx`
A styled `<button>` wrapper. Props: `variant` (`primary` / `secondary` /
`ghost` / `danger` — controlled entirely by CSS classes like `.btn--danger`),
`size`, `isLoading`, and `icon`. When `isLoading` is true, it swaps the icon
for a spinning `<span className="btn-spinner">` and disables the button —
this is the pattern used everywhere a save/delete action is in flight, so
users can't double-submit a form while a request is pending.

### `Modal.jsx`
The base modal/dialog used by every other modal in the app (forms,
confirmations, view-details popups). It:
- Renders nothing if `isOpen` is false.
- Uses `createPortal` to render into `document.body` instead of inline in
  the component tree — this avoids z-index and overflow issues that can
  happen when a modal is nested inside a scrollable card.
- Closes on the `Escape` key and locks page scroll while open
  (`document.body.style.overflow = 'hidden'`), restoring both when it
  unmounts or closes.
- Closing only triggers when you click the dark backdrop itself, not the
  modal panel — done by stopping event propagation on the panel's
  `onMouseDown`.
- Takes `title`, `children` (the body), an optional `footer` (usually
  Cancel/Confirm buttons), and a `size` (`sm` / `md` / `lg`) that maps to a
  max-width in `Modal.css`.

Every other modal in the app (`ConfirmModal`, `UserFormModal`,
`UserViewModal`, `CartFormModal`, `CartViewModal`, and the inline "Edit
profile" modal in `Profile.jsx`) is built *on top of* this one — they pass
their specific content as `children`/`footer` rather than re-implementing
backdrop/escape/portal logic.

### `ConfirmModal.jsx`
A thin specialization of `Modal` for "are you sure?" prompts. Takes
`message`, `onConfirm`, `isLoading`, and `danger` (defaults to `true`, which
makes the confirm button red). Used for every delete action in the app
(Users and Cart List) — the page passes in the specific message
(`Are you sure you want to delete "Jane Doe"?`) and what to actually call
when confirmed.

### `EmptyState.jsx`
A small placeholder shown inside the Users/Cart List tables when there's no
data — either because the API genuinely returned nothing, or because a
search filtered everything out. Takes `icon`, `title`, `message`, and an
optional `action` (e.g., an "Add" button), so each page can customize the
copy ("No users found" vs "No carts found" vs a different message when a
search is active).

### `Loader.jsx`
A simple spinner + label, used both as a full-page loader (`fullScreen`)
while `ProtectedRoute` checks auth, and inline inside cards/tables while
data is being fetched.

### `Pagination.jsx`
Pure presentational component: given `page`, `totalPages`, `totalItems`,
and `pageSize`, it renders "Showing 1–6 of 14" plus page number buttons
(with `…` ellipses when there are more pages than fit) and prev/next
arrows. It has no knowledge of *what* it's paginating — `Users.jsx` and
`CartList.jsx` each do their own slicing of the filtered array and just
hand this component the resulting numbers. Returns `null` outright if
`totalPages <= 1`, so it disappears entirely on short lists.

### `UserFormModal.jsx`
The Add/Edit form for a user, opened from `Users.jsx`. Built with
`react-hook-form` + a `yup` validation schema:

```js
const schema = yup.object({
  firstname: yup.string().required(...),
  lastname: yup.string().required(...),
  username: yup.string().required(...),
  email: yup.string().email(...).required(...),
  phone: yup.string().required(...),
  street: yup.string().required(...),
  city: yup.string().required(...),
  zipcode: yup.string().required(...),
});
```

`useForm({ resolver: yupResolver(schema), defaultValues: toFormValues(initialUser) })`
wires the schema in — `react-hook-form` calls it on submit and populates
`errors` automatically, which each `<input>` reads to show inline error
text. `toFormValues()` flattens the Fake Store API's nested shape
(`user.name.firstname`, `user.address.city`, …) into flat form fields,
because that's much easier to bind to individual `<input>`s than nested
objects.

A `useEffect` calls `reset(toFormValues(initialUser))` whenever
`initialUser` changes — this is what lets the *same* modal be reused for
both "Add" (where `initialUser` is `null`, so the form is blank) and "Edit"
(where it's pre-filled with the clicked row's data), just by passing a
different prop from the parent page.

On submit, `submit(values)` re-nests the flat form values back into the
shape the API expects (`{ name: { firstname, lastname }, address: {...} }`)
before calling the `onSubmit` prop, which `Users.jsx` provides.

### `UserViewModal.jsx`
A read-only modal: avatar + name/username header, then a few label/value
rows (Email, Phone, Address) built with a small local `DetailRow` helper
component. No form, no validation — just formatting helpers from
`utils/format.js`.

### `CartFormModal.jsx`
The Add/Edit form for a cart. Different from `UserFormModal` in one
important way: carts have a *variable-length list* of products, so this
uses plain `useState` instead of `react-hook-form` (react-hook-form is
better suited to fixed sets of fields; a dynamic array of rows is simpler
to manage by hand here).

State shape: `{ userId, date, products: [{ productId, quantity }, ...] }`.
- `addProductRow()` appends a new blank product row.
- `removeProductRow(index)` removes one (disabled when only one row is
  left, so the cart can never have zero products).
- `updateProduct(index, field, value)` updates one field of one row
  immutably (maps over the array, replacing only the matching index).
- `validate()` builds an `errors` object by hand (checking `userId`, `date`,
  and that every product row has a positive `productId`/`quantity`) and
  returns whether the form is valid — the manual equivalent of what `yup`
  does for `UserFormModal`, written out explicitly because the field set is
  dynamic.

On submit, it converts everything from strings (what `<input>`s give you)
to numbers and ISO date format before calling `onSubmit`.

### `CartViewModal.jsx`
Read-only view of a single cart: an icon avatar, cart/user/date header,
then a small table-like list of `Product #<id> → quantity`, and a total
items count at the bottom (via `totalCartQuantity` from `utils/format.js`).

---

## 6. Pages

### `src/pages/Login.jsx`
- If already authenticated, immediately `<Navigate to="/" replace />` —
  this stops a logged-in user from seeing the login form if they manually
  type `/login` in the URL.
- A `react-hook-form` + `yup` form (just `username`/`password`, both
  required), pre-filled with Fake Store API's documented demo credentials
  so the page is usable out of the box.
- On submit, calls `login()` from `AuthContext`. If it succeeds, navigates
  to `location.state?.from?.pathname || '/'` — i.e., back to whichever page
  the user originally tried to visit before being redirected to `/login` by
  `ProtectedRoute`, or to the home page if they just landed on `/login`
  directly.
- Success/failure toasts are actually fired from inside `AuthContext.login`,
  not here — this page only handles the redirect.

### `src/pages/Home.jsx`
The dashboard overview. On mount, it fetches **both** users and carts in
parallel with `Promise.all([getUsers(), getCarts()])`, then derives
everything else from that data with `useMemo`:
- `recentUsers` / `recentCarts` — last 5 of each, reversed so the newest is
  first.
- `cartTrend` — carts sorted by date, mapped to `{ name: '#id', items }` for
  the area chart.
- `usersByActivity` — a rough/fake "Admin vs Customer" split based on
  whether a username contains "adm", just to have a second, different-shaped
  chart to show off Recharts' bar chart alongside the area chart.

Four `StatCard`s at the top (Total Users, Total Carts, Items in carts, Avg
items/cart) are a small local component defined at the bottom of the file,
parameterized by icon/label/value/accent color so they don't repeat markup
four times.

The two charts use Recharts (`AreaChart` and `BarChart`), styled with the
CSS variables from `variables.css` (`var(--accent)`, etc.) so the charts
automatically match the rest of the dark theme instead of using Recharts'
default colors.

### `src/pages/Users.jsx`
The most complete CRUD example in the app — `CartList.jsx` follows the
exact same pattern, so understanding this one explains both.

State:
- `users` — the full list from the API.
- `query` / `debouncedQuery` — search box text, debounced 250ms via the
  `useDebounce` hook so filtering doesn't re-run on every keystroke.
- `sort` — `{ key, dir }`, toggled by clicking column headers.
- `page` — current pagination page.
- `formModal` / `viewModal` / `deleteModal` — each is `{ open, user }`,
  tracking both *whether* a modal is open and *which* row it's for (or
  `null` for "Add" instead of "Edit").

Data flow:
1. `loadUsers()` runs once on mount, calls `getUsers()`, and stores the
   result. Loading/error states use `isLoading` and a toast on failure.
2. `filtered` (a `useMemo`) takes `users`, applies the debounced search
   query (a simple substring match across name/username/email/phone), then
   sorts the result according to `sort`. This re-runs only when `users`,
   `debouncedQuery`, or `sort` actually change.
3. `pageItems` slices `filtered` down to the current page using
   `PAGE_SIZE = 6`.
4. A `useEffect` resets to page 1 if the current page becomes invalid (e.g.
   a search narrows the results enough that the old page no longer exists).
5. `toggleSort(key)` flips the sort direction if you click the same column
   again, otherwise switches to that column ascending.

CRUD handlers:
- `handleSubmitUser(payload)` — called by `UserFormModal`'s `onSubmit`. If
  `formModal.user` is set, it's an edit (`updateUser`, then patches that one
  row in local state); otherwise it's a create (`createUser`, then appends
  a new row, falling back to `Date.now()` as an id since the mock API
  doesn't reliably return a unique one). Either way, shows a success toast
  and closes the modal; shows an error toast and leaves the modal open on
  failure (so the user doesn't lose what they typed).
- `handleDelete()` — called by `ConfirmModal`'s `onConfirm`. Calls
  `deleteUser`, removes the row from local state, toasts, and closes the
  modal.

The actual `<table>` renders sortable `<th>`s (a small `SortableHeader`
helper component shows an up/down chevron on whichever column is active),
each row's actions column (`FiEye`/`FiEdit2`/`FiTrash2` icon buttons that
open the corresponding modal with that row's data), and falls back to
`Loader` or `EmptyState` instead of the table when appropriate.

### `src/pages/CartList.jsx`
Structurally identical to `Users.jsx` — same search/sort/paginate pattern,
same three-modal state shape, same load/create/update/delete handlers —
just pointed at `cartService.js` and `CartFormModal`/`CartViewModal`
instead. The differences worth calling out:
- Sorting supports a derived `items` key (total quantity across all
  products in a cart) and a `date` key, both computed inline in the sort
  comparator since they're not plain fields on the cart object.
- The table shows a `<span className="badge">{products.length} items</span>`
  badge for "distinct products" alongside a separate "Quantity" column for
  total units — two different numbers that are easy to conflate, so they're
  visually distinguished.

### `src/pages/Profile.jsx`
- Fetches one representative user (`fetchCurrentUserProfile(1)`) on mount
  to populate the page, since the Fake Store API has no real "current
  user" concept.
- Renders the avatar/name/username header, an "Edit Profile" button, and a
  list of detail rows (Email, Phone, Username, Address) via a small local
  `ProfileDetail` component (icon + label + value).
- "Edit Profile" opens a `Modal` with a small inline form (first name, last
  name, email — no `react-hook-form` here since the brief only asked for a
  simple edit, not full validation). Saving just updates local component
  state and shows a success toast; like the cart/user mutations, this
  doesn't persist anywhere real since the mock API can't actually store a
  "current user" update.

### `src/pages/NotFound.jsx`
The catch-all 404 page: a big "404", a short message, and a link back to
`/`. Rendered whenever a URL doesn't match any defined route (see the
`path="*"` route in `App.jsx`).

---

## 7. Supporting utilities

### `src/hooks/useDebounce.js`
A generic debounce hook: returns a delayed copy of whatever value you pass
in, updating only after `delay` ms have passed without the value changing
again. Used for the search inputs on `Users.jsx`/`CartList.jsx` so typing
quickly doesn't re-filter/re-render on every keystroke — only once you
pause.

### `src/utils/format.js`
Small, pure formatting helpers shared across pages:
- `formatDate(dateString)` — turns an ISO date into something like
  "Jun 28, 2026"; returns `'—'` for missing/invalid input.
- `getInitials(name)` — first letter of up to the first two words,
  uppercased — used for every avatar in the app.
- `fullName(user)` — Fake Store API users have `{ name: { firstname,
  lastname } }`; this joins them into one string, falling back to the
  username if the name object is missing.
- `fullAddress(user)` — joins street/number, city, and zip into one
  readable line.
- `totalCartQuantity(products)` — sums the `quantity` field across a cart's
  product list.

Centralizing these means every page formats dates/names/addresses
identically, instead of each page writing its own slightly different
version.

---

## 8. Styling system

### `src/styles/variables.css`
The design tokens — every color, spacing constant, font, and radius used
anywhere in the app is defined here once as a CSS custom property
(`--accent`, `--surface`, `--font-display`, etc.) and referenced everywhere
else as `var(--accent)`. This is what makes the dark theme consistent and
easy to re-skin: changing `--accent` here would re-color every button,
active nav link, and chart accent in one place.

### `src/index.css`
Global resets and base element styling (body background/font, scrollbar
styling, focus outlines for accessibility, a `prefers-reduced-motion`
override that disables animations for users who've asked for that at the
OS level) plus the Google Fonts `@import` for Sora/Inter/JetBrains Mono and
the dark-themed overrides for `react-toastify`'s default toast styles.

### `src/styles/shared.css`
Reusable layout classes used across multiple pages so each page's own CSS
file only has to contain what's actually unique to it: `.page`,
`.page-header`, `.page-toolbar`, `.card`/`.table-card`, `.data-table`,
`.form-grid`/`.form-field`, `.badge`, `.avatar`, `.icon-btn`, `.row-actions`,
and the skeleton-loading shimmer animation. `Users.jsx`, `CartList.jsx`,
and `Home.jsx` all import this file.

### Per-component/page CSS files
Each component or page that needs styling beyond the shared classes has its
own colocated `.css` file (`Navbar.css`, `Sidebar.css`, `Modal.css`,
`Login.css`, `CartList.css`, `Profile.css`, `NotFound.css`, etc.), imported
directly at the top of the matching `.jsx` file. Keeping styles next to the
component they belong to makes it easy to find and safely change one
component's look without accidentally affecting another.

---

## 9. How a typical action flows end-to-end (worked example)

To tie all of the above together, here's exactly what happens when you
edit a user:

1. You click the pencil icon in a row on `Users.jsx`. That calls
   `setFormModal({ open: true, user })`, where `user` is that row's data.
2. `<UserFormModal isOpen={formModal.open} initialUser={formModal.user} ... />`
   re-renders with `isOpen = true`. Inside `UserFormModal`, the `useEffect`
   watching `initialUser` calls `reset(toFormValues(initialUser))`, which
   fills every field with that user's current data.
3. `Modal` (the base component `UserFormModal` is built on) portals the
   dialog into `document.body`, locks page scroll, and listens for Escape.
4. You change a field and click "Save changes". `react-hook-form` runs the
   `yup` schema; if anything's invalid, errors appear inline and nothing is
   submitted.
5. On valid submit, `UserFormModal`'s local `submit()` re-shapes the flat
   form values back into the API's nested shape and calls the `onSubmit`
   prop — which is `Users.jsx`'s `handleSubmitUser`.
6. `handleSubmitUser` sees `formModal.user` is set (so this is an edit),
   sets `isSaving = true` (which makes the Save button show a spinner and
   disables it), and calls `updateUser(id, payload)` from
   `services/userService.js`.
7. That goes through the shared `api` Axios instance — attaching the auth
   token via the request interceptor, hitting `PUT /users/:id` on Fake
   Store API, and any error getting normalized into a plain `.message` by
   the response interceptor.
8. On success, `Users.jsx` patches that one row in its local `users` array
   (since the mock API won't actually persist the change), calls
   `toast.success('User updated successfully.')`, and closes the modal by
   setting `formModal` back to `{ open: false, user: null }`.
9. The `ToastContainer` rendered once in `App.jsx` picks up that toast call
   and shows it in the bottom-right corner for 3 seconds.

Every other mutation in the app (create/delete for users and carts, the
profile edit) follows this same shape: a modal collects/validates input →
a page-level handler calls a service function → local state is updated →
a toast confirms or reports the result.
