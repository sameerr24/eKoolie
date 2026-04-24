# eKoolie

eKoolie is a railway station porter booking app built as a React + Vite project. It keeps the same UI, styling, images, and behavior as the original static version, while moving the codebase into a routed React structure.

## What the app does

The app supports two user flows:

1. Traveller flow
   - Visit the landing page.
   - Log in or register.
   - Search for a porter.
   - View the assigned porter profile.
   - Proceed to payment.

2. Porter flow
   - Log in as a porter.
   - Open the porter dashboard.
   - Receive a job notification.
   - Accept the job.
   - Mark the job as completed.
   - Automatically update trips completed and earnings.

## Tech stack

- React 19
- React Router
- Vite
- Plain CSS files reused from the original project
- localStorage for lightweight state persistence

## Project structure

- `src/main.jsx` boots the React app.
- `src/App.jsx` defines the routes.
- `src/pages/` contains the page components.
- `src/legacy/useLegacyPage.js` keeps the original page behavior working inside React.
- `home.css`, `login.css`, `book.css`, `payment.css`, `porter_profile.css`, and `porter_dashboard.css` are reused without redesigning the UI.

## Routes

- `/home` - landing page
- `/login` - login and register page
- `/book` - traveller booking form
- `/payment` - payment selection page
- `/porter-profile` - porter profile page
- `/porter-dashboard` - porter job dashboard

The old `.html` entry routes are redirected to the new React routes for compatibility.

## Complete workflow

### 1. Landing page

The traveller starts on the home page. It explains the service, shows feature cards, and includes sample images from real-world railway/porter visuals.

### 2. Login or register

The login screen supports:

- normal traveller login
- porter login toggle
- register flow

On successful login or registration, the username is stored in `localStorage` so it can be reused across pages.

### 3. Traveller booking flow

After login, the traveller goes to the booking page and fills in:

- train number
- coach
- seat number
- arrival station
- platform number
- arrival time

When searching, the UI simulates porter assignment and reveals a porter card.

### 4. Porter profile

The assigned porter card links to the porter profile page, which shows:

- porter name
- verified license badge
- rating
- completed trips
- experience
- recent reviews

From there the user can continue to payment.

### 5. Payment

The payment page lets the user choose between:

- UPI / QR Code
- Credit / Debit Card
- Cash on Service

The page keeps the same simple confirmation flow as the static version.

### 6. Porter dashboard

The porter dashboard is the active porter-side workflow.

- A job notification appears automatically.
- The porter can accept or decline the job.
- After acceptance, the dashboard switches to a job-in-progress state.
- After completion, the app increments:
  - jobs completed
  - today's earnings

These values are stored in `localStorage`, so they persist across reloads.

## Images and visuals

The migration keeps the same visual direction as the original project:

- existing CSS files are reused
- existing image URLs are preserved
- no redesign was introduced
- the layout and behavior remain intentionally close to the original static pages

## Running locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Notes

- The React version was migrated from the old static HTML, CSS, and JS pages.
- The legacy files are preserved in `legacy-backup/` for reference.
- The app is currently front-end only and uses localStorage instead of a backend database.
