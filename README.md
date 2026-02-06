# WorkOS Test SSO Example App

This is a simple Node.js application demonstrating how to integrate
[Single Sign-On](https://workos.com/docs/sso) using the WorkOS Test Identity Provider.

The app allows users to authenticate via WorkOS SSO and displays basic profile
information returned by the identity provider.

## Features

- Authenticate users using the WorkOS Test Identity Provider
- Display authenticated user details:
  - First name
  - Last name
  - Organization ID
  - 🎁 Bonus: Fetch and display the organization name via the
  [Organizations API](https://workos.com/docs/reference/organization/get)
  - Server-side session management using Express sessions

## Prerequisites

- Node.js 18 or later
- A free [WorkOS Dashboard account](https://dashboard.workos.com/signup)

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/jennantilla/workos-sso-app.git
cd workos-sso-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment variables

Create a `.env` file in the project root and add the following values from your
WorkOS Dashboard:

```bash
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id
```

### 4. Run the app locally

```bash
node index.js
```

👉 the app will be available at http://localhost:8000

## Using Test Single Sign-On

1. Open the app in your browser
2. Click Login with Test SSO
3. On the Test Identity Provider screen, enter a name and an email with an `@example.com` domain
4. Complete authentication
5. You will be redirected back to the app and see:
  - First name
  - Last name
  - Organization ID
  - Organization Name 🎉
6. Logout to test again

![sso_test](https://github.com/user-attachments/assets/27b16b84-9247-4fe0-bb3f-7627a9bf09d3)
