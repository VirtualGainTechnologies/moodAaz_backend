const app = require("./app");
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("=====UNCAUGHT EXCEPTION! 💥 Shutting down=====");
  console.log(err.name, err.message);
  console.log(err);
  process.exit(1);
});

//env connection
require("dotenv").config();

// set up mongoose connection
mongoose
  .connect(process.env.DB_CONNECTION)
  .then(() => {
    console.log("Connected Successfully to Port 27017...");
  })
  .catch((error) => {
    console.log(error);
  });

//server setup
const port = process.env.PORT || 3010;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("warning", (e) => console.warn(e.stack));

//SIGTERM
process.on("SIGTERM", () => {
  if (server) {
    console.log("Server closed.");
    process.exit(1);
  }
});
