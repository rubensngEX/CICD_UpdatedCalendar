const app = require('./app');

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App listening on port ${port}\nhttp://localhost:${port}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});