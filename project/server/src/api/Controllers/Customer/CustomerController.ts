import { Router, Request, Response, NextFunction } from 'express';

import IController from '../IController';
import ICustomerRepository from "../../Repositories/ICustomerRepository";
import CustomerEntity from '../../Entities/Customers';

import ControllerException from '../ControllerException';
import { ParseId, ParseError } from '../utils/utilFunctions';

interface Params {
  customerId: string;
}

type CreateRequest = Request<null, null, CustomerEntity>;
type UpdateRequest = Request<Params, null, CustomerEntity>;

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

  private ParseCustomer = (sendedCustomer: CustomerEntity): CustomerEntity => {
    if (!sendedCustomer || Object.keys(sendedCustomer).length === 0)
      throw new ControllerException(400, 'Customer not provided');

    // Ensure that cannot pass invalid attributes
    const { name, email, address, phone, observation } = sendedCustomer;
    const customer = { name, email, address, phone, observation };

    try {
      if (!name)
        throw 'Name is required';

      if (!email)
        throw 'Email is required';

      if (!address)
        throw 'Address is required';

      if (!phone)
        throw 'Phone is required';

      return customer;
    } catch (error) {
      throw new ControllerException(400, 'Invalid customer', error);
    }
  }

  // Arrow Function bind 'this'
  private Create = async (req: CreateRequest, res: Response, next: NextFunction) => {
    try {
      const customer = this.ParseCustomer(req.body);

      await this.repo.Create(customer);
      return res.status(201).send();
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on create customer'));
    }
  }

  private Update = async (req: UpdateRequest, res: Response, next: NextFunction) => {
    try {
      const id = ParseId(req.params.customerId, 'Invalid customer\'s id');
      const customer = this.ParseCustomer(req.body);

      await this.repo.Update({ ...customer, id });
      return res.status(201).send();
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on update customer'));
    }
  }

  private Show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = ParseId(req.params.customerId, 'Invalid customer\'s id');

      const customer = await this.repo.Show(id);
      return res.json(customer);
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on show customer'));
    }
  }

  private List = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customers = await this.repo.List();
      return res.json(customers);
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on list customers'));
    }
  }

  private Delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = ParseId(req.params.customerId,'Invalid customer\'s id');

      await this.repo.Delete(id);
      return res.status(201).send();
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on delete customer'));
    }
  }
}
