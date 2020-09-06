import { Router, Request, Response } from 'express';

import IController from '../IController';
import ICustomerRepository from "../../Repositories/ICustomerRepository";
import CustomerEntity from '../../Entities/Customers';

type CreateRequest = Request<null, null, CustomerEntity>;

export default class CustomerController implements IController {
  readonly Path: string = '/customers';
  readonly Router = Router();
  
  constructor(private repo: ICustomerRepository) {
    this.Router.post('/', this.Create);
    this.Router.put('/:customerId', this.Update);
    this.Router.get('/:customerId', this.Show);
    this.Router.get('/', this.List);
    this.Router.delete('/:customerId', this.Delete);
  }

  // Arrow Function bind 'this'
  private Create = async (req: Request, res: Response) => {
  }

  private Update = async (req: Request, res: Response) => {
  }

  private Show = async (req: Request, res: Response) => {
  }

  private List = async (req: Request, res: Response) => {
  }

  private Delete = async (req: Request, res: Response) => {
  }
}
