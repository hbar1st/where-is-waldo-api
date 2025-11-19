process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  throw reason; // fail the test
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  throw err; // fail the test
});
