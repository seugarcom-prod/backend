import express from "express";
import auth from "./auth";
import user from "./user";
import restaurant from "./restaurant";
import requests from "./order";
import order from "./order";
import restaurantUnit from './restaurantUnit';

const router = express.Router();

export default (): express.Router => {
  auth(router);
  user(router);
  order(router);
  restaurant(router);
  restaurantUnit(router)
  requests(router);

  return router;
};
