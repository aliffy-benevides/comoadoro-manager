import { Router } from "express";

import IController from "../IController";

import IOrderRepository from "../../Repositories/IOrderRepository";
import ICustomerRepository from "../../Repositories/ICustomerRepository";
import IProductRepository from "../../Repositories/IProductRepository";

export default class OrderController implements IController {
  readonly Path: string = '/orders';
  readonly Router = Router();
  
  constructor(
    private repo: IOrderRepository,
    private customerRepo: ICustomerRepository,
    private productRepo: IProductRepository
  ) {
    this.Router.use('/', (req, res) => {
      return res.send('OK');
    })
  }
}