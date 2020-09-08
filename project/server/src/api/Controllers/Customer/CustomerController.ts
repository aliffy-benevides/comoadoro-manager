import { Router, Request, Response } from 'express';

import IController from '../IController';
import ControllerError from '../ControllerError';
import ICustomerRepository from "../../Repositories/ICustomerRepository";
import CustomerEntity from '../../Entities/Customers';
import RepositoryError from '../../Repositories/RepositoryError';

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
  private Create = async (req: CreateRequest, res: Response) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0)
        throw new ControllerError(400, 'Customer not provided');

      const { name, email, address, phone, observation } = req.body;
      const customer = { name, email, address, phone, observation };

      const error = this.ValidateCustomer(customer);
      if (error)
        throw new ControllerError(400, 'Invalid customer', error);

      await this.repo.Create(customer);
      return res.status(201).send();
    } catch (error) {
      if (error instanceof ControllerError)
        return res.status(error.status).json(error);

      return res.status(500).json({
        message: 'Unexpected error on create customer',
        error
      })
    }
  }

  private Update = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.customerId);
      if (isNaN(id))
        throw new ControllerError(404, 'Invalid customer\'s id');

      if (!req.body || Object.keys(req.body).length === 0)
        throw new ControllerError(400, 'Customer not provided');

      const { name, email, address, phone, observation } = req.body;
      const customer = { name, email, address, phone, observation, id };

      const error = this.ValidateCustomer(customer);
      if (error)
        throw new ControllerError(400, 'Invalid customer', error);

      await this.repo.Update(customer);
      return res.status(201).send();
    } catch (error) {
      if (error instanceof ControllerError)
        return res.status(error.status).json(error);

      if (error instanceof RepositoryError)
        return res.status(error.status).json(error);

      return res.status(500).json({
        message: 'Unexpected error on update customer',
        error
      })
    }
  }

  private Show = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.customerId);
      if (isNaN(id))
        throw new ControllerError(404, 'Invalid customer\'s id');

      const customer = await this.repo.Show(id);
      return res.json(customer);
    } catch (error) {
      if (error instanceof ControllerError)
        return res.status(error.status).json(error);

      if (error instanceof RepositoryError)
        return res.status(error.status).json(error);

      return res.status(500).json({
        message: 'Unexpected error on show customer',
        error
      })
    }
  }

  private List = async (req: Request, res: Response) => {
    try {
      const customers = await this.repo.List();
      return res.json(customers);
    } catch (error) {
      if (error instanceof ControllerError)
        return res.status(error.status).json(error);

      if (error instanceof RepositoryError)
        return res.status(error.status).json(error);

      return res.status(500).json({
        message: 'Unexpected error on list customers',
        error
      })
    }
  }

  private Delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.customerId);
      if (isNaN(id))
        throw new ControllerError(404, 'Invalid customer\'s id');

      await this.repo.Delete(id);
      return res.status(201).send();
    } catch (error) {
      if (error instanceof ControllerError)
        return res.status(error.status).json(error);

      if (error instanceof RepositoryError)
        return res.status(error.status).json(error);

      return res.status(500).json({
        message: 'Unexpected error on delete customer',
        error
      })
    }
  }

  private ValidateCustomer = (customer: CustomerEntity) => {
    const { name, email, address, phone } = customer;

    if (!name)
      return 'Name is required';

    if (!email)
      return 'Email is required';

    if (!address)
      return 'Address is required';

    if (!phone)
      return 'Phone is required';

    return null;
  }
}
