import express from "express";
import auth from "./auth";
import user from "./user";
import restaurant from "./restaurant";
import requests from "./order";
import order from "./order";

const router = express.Router();

export default (): express.Router => {
  auth(router);
  user(router);
  order(router);
  restaurant(router);
  requests(router);

  return router;
};
