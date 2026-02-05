import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";

const app = express();

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
  res.send("Hello World!");
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
