const express = require('express');
const app = express();
const port = 5002; // Use a different port

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});

// Don't add signal handlers for this test