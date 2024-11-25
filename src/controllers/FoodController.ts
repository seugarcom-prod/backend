import express from "express";
import {
  createFood,
  deleteFood,
  getFoodById,
  getFoodByName,
  getFoods,
  updateFood,
} from "../models/Foods.ts";

export const createFoodController = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;

  const existingFood = await getFoodById(id);
  if (existingFood) return res.sendStatus(400);

  const { name, restaurant, category, description, price, image } = req.body;

  const sameName = await getFoodByName(name);
  if (sameName) return res.sendStatus(400);

  if (!name || !restaurant || !category || !price || !description || !image)
    return res.sendStatus(400);

  try {
    const newFood = await createFood({
      restaurant,
      category,
      name,
      price,
      description,
      image
    });

    res.status(201).json(newFood).end();
  } catch (error) {
    console.log("Erro: ", error);
  }
};

export const getAllFoodsController = async (res: express.Response) => {
  try {
    const foods = await getFoods();

    return res.status(200).json(foods);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const getFoodByIdController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const user = await getFoodById(id);

    if (!user) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateFoodController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const { name, category, price, description, image, isAvailable } = req.body;

    const food = await getFoodById(id);

    if (food) {
      food[0].name = name;
      food[0].category = category;
      food[0].price = price;
      food[0].description = description;
      food[0].image = image;
      food[0].isAvailable = isAvailable;

      await updateFood(id, food);
    }

    return res.status(200).json(food);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteFoodController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;

    const deletedFood = await deleteFood(id);

    return res.json(deletedFood);
  } catch (error) {
    console.log(error);
  }
};
