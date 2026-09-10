const { app, ensureInitialized } = require('./app');

const PORT = process.env.PORT || 5000;

ensureInitialized().then(() => {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
