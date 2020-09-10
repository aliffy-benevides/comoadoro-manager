import { Router } from "express";

import IController from "../IController";
import IProductRepository from "../../Repositories/IProductRepository";

export default class ProductController implements IController {
  readonly Path = '/products';
  readonly Router = Router();

  constructor(private repo: IProductRepository) {
    this.Router.use('/', (req, res) => {
      return res.send('OK');
    })
  }
}