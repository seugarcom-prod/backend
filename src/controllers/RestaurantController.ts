import express from "express";
import {
  createRestaurant,
  deleteRestaurant,
  getRestaurantById,
  getRestaurantByName,
  getRestaurants,
  updateRestaurant,
} from "../models/Restaurant.ts";

export const createRestaurantController = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;

  const existingRestaurant = await getRestaurantById(id);
  if (existingRestaurant) return res.sendStatus(400);

  const { name, cnpj, address, logo, units } = req.body;

  const sameName = await getRestaurantByName(name);
  if (sameName) return res.sendStatus(400);

  if (!name || !cnpj || !address || !logo || !units) return res.sendStatus(400);

  try {
    const restaurant = await createRestaurant({
      address,
      cnpj,
      name,
      logo,
      units,
    });

    res.status(201).json(restaurant).end();
  } catch (error) {
    console.log("Erro: ", error);
  }
};

export const getAllRestaurantsController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const restaurants = await getRestaurants();

    return res.status(200).json(restaurants);
  } catch (error) {
    return res.sendStatus(400);
  }
};

export const getRestaurantByIdController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const restaurant = await getRestaurantById(id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateRestaurantController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const { address, cnpj, name, logo, units } = req.body;

    const restaurant = await getRestaurantById(id);

    if (restaurant) {
      restaurant.name = name;
      restaurant.address = address;
      restaurant.cnpj = cnpj;
      restaurant.logo = logo;
      restaurant.units = [units];

      await updateRestaurant(id, restaurant);
    }

    return res.status(200).json(restaurant);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteRestaurantController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;

    const deletedRestaurant = await deleteRestaurant(id);

    return res.json(deleteRestaurant);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
