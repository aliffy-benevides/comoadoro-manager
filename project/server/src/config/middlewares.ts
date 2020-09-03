import express from 'express';
import cors from 'cors';

const middlewares = express.Router();

middlewares.use(cors());
middlewares.use(express.json());

export default middlewares;