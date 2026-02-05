import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import { WorkOS } from "@workos-inc/node";

const app = express();

// WorkOS
const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID;

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, //local only
    })
);

// Home
app.get("/", (req, res) => {
    if (req.session.isLoggedIn) {
        res.render("login_successful", {
            profile: req.session.profile,
            firstName: req.session.firstName,
            lastName: req.session.lastName,
            organization: req.session.organizationId,
            organizationName: req.session.organizationName,
        });
    } else {
        res.render("index");
    }
});

// Test SSO with Test Identity Provider
app.get('/auth', (_req, res) => {
    const organization = 'org_test_idp'; // Test SSO org

    const redirectUri = 'http://localhost:8000/callback'; // callback for SSO

    const authorizationUrl = workos.sso.getAuthorizationUrl({
        organization,
        redirectUri,
        clientId,
    });

    res.redirect(authorizationUrl);
});

app.get("/callback", async (req, res) => {
    try {
        const { code, error } = req.query;
        if (error) {
            return res.send(`Redirect callback error: ${error}`);
        }

        const profile = await workos.sso.getProfileAndToken({
            code,
            clientId,
        });

        // Organization validation omitted for Test Provider flow
        // In production, compare against a known organization ID

        // if (profile.organizationId !== expectedOrganizationId) {
        //     return res.status(401).send({ message: 'Unauthorized' });
        // }

        req.session.firstName = profile.profile.firstName;
        req.session.lastName = profile.profile.lastName;
        req.session.organizationId = profile.profile.organizationId;
        req.session.profile = profile;
        req.session.isLoggedIn = true;

        const org = await workos.organizations.getOrganization(
            profile.profile.organizationId
        );
        req.session.organizationName = org.name;

        // Save session before redirect to ensure isLoggedIn persists
        req.session.save((err) => {
            if (err) console.error(err);
            res.redirect("/");
        });
    } catch (err) {
        res.send("Error exchanging code for profile: " + err);
    }
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
