const dotenv = require('dotenv');
const express = require('express');
const http = require('http');
const router = require('./routes/index.routes.js');
const { mongoDbConnection } = require('./db/connection.js');
const cors = require('cors');

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT_NUMBER || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);
app.use(cors());

app.set('view engine', 'ejs');

app.use('/api/v1', router);

const startServer = () => {
  server.listen(port, () => console.log(`URL Tracker running at http://localhost:${port}`));
};

mongoDbConnection()
  .then(() => {
    startServer();
  })
  .catch((error) => {
    console.log(error);
  });
