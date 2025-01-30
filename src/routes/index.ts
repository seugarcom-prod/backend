import { Router } from "express";
import auth from "./auth";
import user from "./user";
import restaurant from "./restaurant";
import requests from "./order";
import order from "./order";
import products from './products';
import restaurantUnit from './restaurantUnit';

const router = Router();

export default (): Router => {
  auth(router);
  user(router);
  order(router);
  products(router);
  restaurant(router);
  restaurantUnit(router)
  requests(router);

  return router;
};
