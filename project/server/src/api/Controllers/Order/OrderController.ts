import { Router, Request, Response, NextFunction } from "express";

import IController from "../IController";

import IOrderRepository from "../../Repositories/IOrderRepository";
import ICustomerRepository from "../../Repositories/ICustomerRepository";
import IProductRepository from "../../Repositories/IProductRepository";
import { FullOrderEntity, FullOrderItemEntity, OrderStatusEnum } from "../../Entities/Orders";
import { ParseError, ParseId } from "../utils/utilFunctions";

import ControllerException from "../ControllerException";
import { FullProductEntity } from "../../Entities/Products";
import { stat } from "fs";

interface Params {
  orderId: string;
}
type CreateRequest = Request<null, null, FullOrderEntity>;
type UpdateRequest = Request<Params, null, FullOrderEntity>;

export default class OrderController implements IController {
  readonly Path: string = '/orders';
  readonly Router = Router();

  constructor(
    private repo: IOrderRepository,
    private customerRepo: ICustomerRepository,
    private productRepo: IProductRepository
  ) {
    this.Router.get('/status', this.ListStatus);

    this.Router.post('/', this.Create);
    this.Router.put('/:orderId', this.Update);
    this.Router.get('/:orderId', this.Show);
    this.Router.get('/', this.List);
    this.Router.delete('/:orderId', this.Delete);
    this.Router.put('/:orderId/finish', this.FinishOrder);
    this.Router.put('/:orderId/cancel', this.CancelOrder);
  }

  /**
   * Fill items with necessary properties to send back to response
   * @param items Pure items without product and packing properties
   * @param isFullProduct Boolean that indicates that if the items' product has to be full
   */
  private FillItems = async (items: FullOrderItemEntity[], isFullProduct: boolean = false): Promise<FullOrderItemEntity[]> => {
    const packings = await this.productRepo.ListPackings();

    return await Promise.all(items.map(async item => {
      let product = await this.productRepo.Show(item.product_id);
      const packing = product.is_packed ? packings.find(p => p.id === item.packing_id) : undefined;

      // Remove extends properties of FullProductEntity if it is necessary
      if (!isFullProduct) {
        const { category, features, packings, ...rest } = product;
        product = rest as any;
      }

      return {
        ...item,
        product,
        packing
      }
    }))
  }

  /**
   * Parse Items to send to repository
   * @param items 
   */
  private ParseItems = (items: FullOrderItemEntity[]): FullOrderItemEntity[] => {
    return items.map(item => {
      const {
        amount,
        product_id, packing_id, unit_price
      } = item;

      if (!amount && amount !== 0)
        throw `Missing amount of item: ${item}`;
      if (amount < 0)
        throw `Amount cannot be less than zero: ${item}`;
      if (!product_id && product_id !== 0)
        throw `Missing product\'s id of item: ${item}`;

      return {
        amount,
        product_id, packing_id, unit_price
      };
    });
  }

  /**
   * Parse Order to send to repository
   * @param sendedOrder order sended from request
   * @returns Parsed order
   */
  private ParseOrder = async (sendedOrder: FullOrderEntity): Promise<FullOrderEntity> => {
    if (!sendedOrder || Object.keys(sendedOrder).length === 0)
      throw new ControllerException(400, 'Order not provided')

    let {
      customer_id, order_date, delivery_date, status, discount, shipping, observation,
      items, customer
    } = sendedOrder;


    try {
      if (!customer_id && customer_id !== 0)
        throw 'Customer\'s id is required';

      status = status || 'Registered';
      order_date = order_date || new Date().toISOString();
      delivery_date = delivery_date || new Date().toISOString();
      discount = discount || 0;
      shipping = shipping || 0;
    } catch (error) {
      throw new ControllerException(400, 'Invalid order', error);
    }

    try {
      items = this.ParseItems(items);
      const filledItems = await this.FillItems(items, true);

      for (const item of filledItems) {
        if (!item.product)
          throw 'Item product not found';
        if (item.product.is_packed) {
          if (!item.packing_id)
            throw 'Items without packing_id, but the product is packed';
          if (!item.packing)
            throw 'Items has not found packings';
        }
      }

      items = items.map((item, index) => {
        const filledItem = filledItems[index];
        const unit_price = filledItem.product?.is_packed
          ? (filledItem.product as FullProductEntity).packings.find(p => p.id === item.packing_id)?.productPacking.price
          : filledItem.product?.unit_price as number;

        return {
          ...item,
          unit_price
        }
      })
    } catch (error) {
      if (typeof error === 'string')
        throw new ControllerException(400, 'Order with invalid items', error);

      throw new ControllerException(400, 'Order with invalid items', undefined, error);
    }

    const order = {
      customer_id, order_date, delivery_date, status, discount, shipping, observation,
      items, customer
    };
    return order;
  }

  private Create = async (req: CreateRequest, res: Response, next: NextFunction) => {
    try {
      const order = await this.ParseOrder(req.body);

      await this.repo.Create(order);
      return res.status(201).send();
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on create order'));
    }
  }

  private Update = async (req: UpdateRequest, res: Response, next: NextFunction) => {
    try {
      const id = ParseId(req.params.orderId, 'Invalid order\'s id');
      const order = await this.ParseOrder(req.body);

      await this.repo.Update({ ...order, id });
      return res.status(201).send();
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on update order'));
    }
  }

  private Show = async (req: Request<Params>, res: Response, next: NextFunction) => {
    try {
      const id = ParseId(req.params.orderId, 'Invalid order\'s id');

      const order = await this.repo.Show(id);
      order.customer = await this.customerRepo.Show(order.customer_id as number);
      order.items = await this.FillItems(order.items);

      return res.json(order);
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on show order'));
    }
  }

  private List = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let orders = await this.repo.List();
      orders = await Promise.all(orders.map(async order => {
        order.customer = await this.customerRepo.Show(order.customer_id as number);
        order.items = await this.FillItems(order.items);

        return order;
      }))

      return res.json(orders);
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on list orders'));
    }
  }

  private Delete = async (req: Request<Params>, res: Response, next: NextFunction) => {
    try {
      const id = ParseId(req.params.orderId, 'Invalid order\'s id');

      await this.repo.Delete(id);
      return res.status(201).send();
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on delete order'));
    }
  }

  private VerifyOrderRegisteredStatus = (order: FullOrderEntity) => {
    try {
      if (order.status === 'Finished')
        throw 'The order is already finished';
      if (order.status === 'Canceled')
        throw 'The order is already canceled';
    } catch (message) {
      throw new ControllerException(400, message);
    }
  }

  private FinishOrder = async (req: Request<Params>, res: Response, next: NextFunction) => {
    try {
      const id = ParseId(req.params.orderId, 'Invalid order\'s id');
      const order = await this.repo.Show(id);

      this.VerifyOrderRegisteredStatus(order);
      
      await this.repo.Update({ id, status: 'Finished' });
      return res.status(201).send();
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on finish order'));
    }
  }

  private CancelOrder = async (req: Request<Params>, res: Response, next: NextFunction) => {
    try {
      const id = ParseId(req.params.orderId, 'Invalid order\'s id');
      const order = await this.repo.Show(id);

      this.VerifyOrderRegisteredStatus(order);
      
      await this.repo.Update({ id, status: 'Canceled' });
      return res.status(201).send();
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on cancel order'));
    }
  }

  private ListStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status: OrderStatusEnum[] = [ 'Registered', 'Finished', 'Canceled' ];
      return res.json(status);
    } catch (error) {
      return next(ParseError(error, 'Unexpected error on list order\'s status'));
    }
  }
}