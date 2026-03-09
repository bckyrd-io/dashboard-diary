# Dashboard Diary (Next-Type)

Dashboard Diary is a web application built with **Next.js**. It currently features a responsive Next.js web frontend, with an API backend connected to a Postgres database using Drizzle ORM. 

**Note on Mobile Development:** In the future, this project plans to introduce a mobile application built with **React Native / Expo**. You may see references to Expo in the directory structure or planned steps, but the application is currently actively using the Next.js UI for both web and mobile-web experiences.

## Project Overview

- **Frontend / Backend:**
  - Developed using **Next.js** (Current UI).
  - Handles API requests and serves the responsive web interface.
- **Database:**
  - **Postgres** integrated using **Drizzle ORM**.
- **Future Upgrade:**
  - A mobile-first **Expo** (React Native) app is planned for future cross-platform (iOS/Android) releases.
- **Package Managers:**
  - **Next.js Project**: Using **pnpm** for faster performance.
  - *(Future)* **Expo App**: Will use npm (or eventually pnpm).

## Features

- Mobile-responsive web design currently powered by Next.js.
- API endpoints in Next.js connected to a Postgres database via Drizzle ORM.
- Current use case: **Farm Management** system, including:
  - Tracking farm revenues.
  - Tracking farm expenses.
  - Branch and User management.
  - More farm-related features to come.

## Getting Started

### Prerequisites

Make sure you have the following installed:
- **Node.js** (>= 18.x recommended)
- **pnpm** (>= 7.x)
- **Postgres Database**

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd dashboard-diary
```

#### 2. Install Dependencies

Navigate to the project folder and run:

```bash
pnpm install
```

#### 3. Database Setup

Ensure your Postgres database is up and running. 

Create a `.env.local` or `.env` file in the root directory with your database credentials and other necessary environment variables:

```env
DATABASE_URL=your_postgres_database_url
```

Drizzle ORM will handle the database schema and migrations. To run migrations and push the schema:

```bash
pnpm dlx drizzle-kit migrate
# or depending on your package.json scripts:
# pnpm run drizzle:sync
```

*(Optional)* If you are linking to an existing Vercel project's database:

```bash
pnpm dlx vercel link
pnpm dlx vercel env pull .env.development.local
```

#### 4. Running the Application

Run the development server:

```bash
pnpm dev
```

This will start the Next.js application on [http://localhost:3000](http://localhost:3000).

---

### Initial Setup: Creating Users

Since the system starts without an admin, follow these steps via the browser once the app is running:

1. **Create a branch:**
   Navigate to `http://localhost:3000/farm/branch/add` and add a branch.
2. **Add a new user:**
   Navigate to `http://localhost:3000/farm/user/add` and create your user account.
3. **Update user role in database:**
   Use your database client to update the user's role to admin so you have full access:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'youremail@example.com';
   ```

---

## Directory Structure

```text
/
├── app/                  # Next.js App Router (Pages & API)
│   ├── api/              # API Endpoints
│   │   ├── activities/
│   │   ├── persons/
│   │   └── activity-persons/
│   ...
├── components/           # Reusable React components
...
```

### Future Expo App Structure

Once the React Native / Expo migration begins, the app will include a separate directory structure (e.g., `/expo-app`) with mobile-specific screens, navigation, and components, which will connect to the existing Next.js API. 

**Excluding Expo App from Vercel Deployment**
To keep the future Expo app inside the project folder but exclude it from being deployed to Vercel, a `.vercelignore` file will be used with the path to the Expo directory.

## Future Plans

- **Implement the React Native / Expo App** for dedicated iOS and Android mobile experiences.
- Migrate the future Expo app to use `pnpm` consistently.
- Add more features for comprehensive farm management and tracking.

## Contributing

Contributions are welcome! Feel free to submit pull requests or open issues on GitHub to help improve the project.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
