import { Router } from "express";
import auth from "./auth";
import user from "./user";
import restaurant from "./restaurant";
import requests from "./order";
import order from "./order";
import products from './products';
import restaurantUnit from './restaurantUnit';
import employee from "./employee";

export default (): Router => {
  const router = Router();

  auth(router);
  user(router);
  employee(router);
  order(router);
  products(router);
  restaurant(router);
  restaurantUnit(router)
  requests(router);

  return router;
};
