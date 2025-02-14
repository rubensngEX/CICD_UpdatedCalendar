const express = require("express");
const createError = require("http-errors");
const path = require("path");
const serveFavicon = require("serve-favicon");
const session = require("express-session");
// const passport = require("../src/google/passport"); // Import Passport.js
const logger = require("./services/logger"); // Import Pino logger

const taskRouter = require("./routers/Task.router");
const statusRouter = require("./routers/Status.router");
const personRouter = require("./routers/Person.router");
const projectRouter = require("./routers/Project.router");
const authRouter = require("./routers/Auth.router");
const gAuthRouter = require("./routers/GAuth.router"); // ✅ Google OAuth Router
const notiRouter = require("./routers/Notification.router");
const teamRouter = require("./routers/Team.router");
const fileRouter = require("./routers/File.router");

const app = express();

// 🔹 Session Middleware (required for Passport authentication)
// app.use(
//   session({
//     secret: "your-secret-key",
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// 🔹 Initialize Passport.js
// app.use(passport.initialize());
// app.use(passport.session());


app.use(express.json());

// Middleware to log all incoming requests
app.use((req, res, next) => {
  logger.info(
    { method: req.method, url: req.url, headers: req.headers },
    "Incoming request"
  );
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve favicon.ico from the 'public' directory
app.use(serveFavicon(path.join(__dirname, "public", "favicon.ico")));

// 🔹 Routers
app.use("/tasks", taskRouter);
app.use("/statuses", statusRouter);
app.use("/persons", personRouter);
app.use("/projects", projectRouter);
app.use("/auth", authRouter);
app.use("/gauth", gAuthRouter); // ✅ Google OAuth Router
app.use("/noti", notiRouter);
app.use("/teams", teamRouter);
app.use("/files", fileRouter);

// 🔹 Protected Route (Example: Dashboard)
app.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/gauth/google");
  res.json({ message: `Welcome, ${req.user.name}` });
});

// Handle unknown resources
app.use((req, res, next) => {
  const error = createError(
    404,
    `Unknown resource ${req.method} ${req.originalUrl}`
  );
  logger.warn({ method: req.method, url: req.url, status: 404 }, error.message);
  next(error);
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error(
    {
      method: req.method,
      url: req.url,
      status: error.status || 500,
      stack: error.stack,
    },
    "Error occurred"
  );
  res.status(error.status || 500).json({
    error: error.message || "Unknown Server Error!",
  });
});

module.exports = app;
