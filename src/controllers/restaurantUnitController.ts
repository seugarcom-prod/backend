import { Request, Response } from "express";
import {
  createRestaurantUnit,
  deleteRestaurantUnit,
  getRestaurantUnit,
  getRestaurantUnitById,
  updateRestaurantUnit,
} from "../models/RestaurantUnit.ts";

export const createRestaurantUnitController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  const existingRestaurantUnit = await getRestaurantUnitById(id);
  if (existingRestaurantUnit) return res.sendStatus(400);

  const { cnpj, address, contact, manager } = req.body;

  if (!cnpj || !address || !contact || !manager) return res.sendStatus(400);

  try {
    const restaurantUnit = await createRestaurantUnit({
      address,
      cnpj,
      contact,
      manager,
    });

    res.status(201).json(restaurantUnit).end();
  } catch (error) {
    console.log("Erro: ", error);
  }
};

export const getAllRestaurantUnitsController = async (
  req: Request,
  res: Response
) => {
  try {
    const restaurantUnits = await getRestaurantUnit();

    return res.status(200).json(restaurantUnits);
  } catch (error) {
    return res.sendStatus(400);
  }
};

export const getRestaurantUnitByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const restaurant = await getRestaurantUnitById(id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateRestaurantUnitController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { address, cnpj, contact, manager } = req.body;

    const restaurantUnit = await getRestaurantUnitById(id);

    if (restaurantUnit) {
      restaurantUnit.address = address;
      restaurantUnit.cnpj = cnpj;
      restaurantUnit.phone = contact;
      restaurantUnit.manager = manager;

      await updateRestaurantUnit(id, restaurantUnit);
    }

    return res.status(200).json(restaurantUnit);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteRestaurantUnitController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const deletedRestaurantUnit = await deleteRestaurantUnit(id);

    return res.json(deletedRestaurantUnit);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
