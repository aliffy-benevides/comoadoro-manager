import express from 'express';
import middlewares from './config/middlewares';

const app = express();

app.use(middlewares);

app.listen(3333, () => {
  console.log(`Server is running on http://localhost:3333`);
});