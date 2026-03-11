import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import { WorkOS } from "@workos-inc/node";
import cookieParser from "cookie-parser";

const app = express();

// WorkOS
const workos = new WorkOS(process.env.WORKOS_API_KEY, {
    clientId: process.env.WORKOS_CLIENT_ID,
});

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(cookieParser());

// OPTIONAL Define localhost cookie options
const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: false, // localhost only
    sameSite: 'lax',
};

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, //local only
    })
);

// AuthKit Home
app.get('/', async (req, res) => {
    let user = null;

    try {
        const session = workos.userManagement.loadSealedSession({
            sessionData: req.cookies['wos-session'],
            cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
        });

        const authResult = await session.authenticate();
        if (authResult.authenticated) {
            user = authResult.user;
        }
    } catch (e) {
        // Not authenticated
    }

    res.render('authkit_index', { user });
});

app.get('/auth', (_req, res) => {
    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
        provider: 'authkit',
        redirectUri: 'http://localhost:8000/callback',
        clientId: process.env.WORKOS_CLIENT_ID,
    });

    res.redirect(authorizationUrl);
});

// Auth middleware function
async function withAuth(req, res, next) {
    const session = workos.userManagement.loadSealedSession({
        sessionData: req.cookies['wos-session'],
        cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
    });

    const { authenticated, reason } = await session.authenticate();

    if (authenticated) {
        return next();
    }

    // If the cookie is missing, redirect to login
    if (!authenticated && reason === 'no_session_cookie_provided') {
        return res.redirect('/auth');
    }

    // If the session is invalid, attempt to refresh
    try {
        const { authenticated, sealedSession } = await session.refresh();

        if (!authenticated) {
            return res.redirect('/auth');
        }

        // update the cookie
        res.cookie('wos-session', sealedSession, cookieOptions);

        // Redirect to the same route to ensure the updated cookie is used
        return res.redirect(req.originalUrl);
    } catch (e) {
        // Failed to refresh access token, redirect user to login page
        // after deleting the cookie
        res.clearCookie('wos-session');
        res.redirect('/auth');
    }
}

app.get("/callback", async (req, res) => {
    // The authorization code returned by AuthKit
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        const authenticateResponse =
            await workos.userManagement.authenticateWithCode({
                clientId: process.env.WORKOS_CLIENT_ID,
                code,
                session: {
                    sealSession: true,
                    cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
                },
            });

        const { user, sealedSession } = authenticateResponse;

        // Store the session in a cookie
        res.cookie('wos-session', sealedSession, cookieOptions);

        // Use the information in `user` for further business logic.

        // Redirect the user to the dashboard
        return res.redirect('/dashboard');
    } catch (error) {
        return res.redirect('/auth');
    }
});

// Specify the `withAuth` middleware function we defined earlier to protect this route
app.get('/dashboard', withAuth, async (req, res) => {
    const session = workos.userManagement.loadSealedSession({
        sessionData: req.cookies['wos-session'],
        cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
    });

    const { user } = await session.authenticate();

    console.log(`User ${user.firstName} is logged in`);

    res.render('dashboard', { user });
});

// Logout
app.get("/logout", async (req, res) => {
    const session = workos.userManagement.loadSealedSession({
        sessionData: req.cookies['wos-session'],
        cookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
    });

    const url = await session.getLogoutUrl();

    res.clearCookie('wos-session', cookieOptions);
    res.redirect(url);
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
