const express = require('express');
const app = express();
const port = 3000;

// APP_VERSION will be 'Blue' or 'Green'
const version = process.env.APP_VERSION || 'Unknown';
// A simple way to change the background color
const color = version === 'Blue' ? '#3498db' : '#2ecc71'; 

app.get('/', (req, res) => {
  res.send(`
    <body style="background-color:${color}; color:white; font-family:sans-serif; text-align:center; padding-top:20%;">
      <h1>Hello from the ${version} Server!</h1>
      <h2>This is the live production environment.</h2>
    </body>
  `);
});

app.listen(port, () => {
  console.log(`App (${version}) listening on port ${port}`);
});