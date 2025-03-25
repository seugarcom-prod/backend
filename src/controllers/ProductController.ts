import express from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductByName,
  getProducts,
  updateProduct
} from "../models/Products.ts";

export const createFoodController = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;

  const existingFood = await getProductById(id);
  if (existingFood) return res.sendStatus(400);

  const { name, restaurant, category, description, price, image, quantity } = req.body;

  const sameName = await getProductByName(name);
  if (sameName) return res.sendStatus(400);

  if (!name || !restaurant || !category || !price || !description || !image || !quantity)
    return res.sendStatus(400);

  try {
    const newFood = await createProduct({
      restaurant,
      category,
      name,
      price,
      description,
      image,
      quantity
    });

    res.status(201).json(newFood).end();
  } catch (error) {
    console.log("Erro: ", error);
  }
};

export const createMultipleProductsController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { products } = req.body;
    const restaurantId = req.params.id;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Lista de produtos inválida" });
    }

    const createdProducts = [];

    for (const product of products) {
      // Adicionar restaurantId a cada produto
      product.restaurant = restaurantId;

      // Validar campos obrigatórios
      if (!product.name || !product.price || !product.quantity) {
        return res.status(400).json({
          message: "Campos obrigatórios ausentes",
          product
        });
      }

      // Criar produto
      const newProduct = await createProduct(product);
      createdProducts.push(newProduct);
    }

    return res.status(201).json(createdProducts);
  } catch (error) {
    console.error("Erro ao criar produtos:", error);
    return res.status(500).json({ message: "Erro ao criar produtos" });
  }
};

export const getAllFoodsController = async (res: express.Response) => {
  try {
    const foods = await getProducts();

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
    const user = await getProductById(id);

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

    const food = await getProductById(id);

    if (food) {
      food.name = name;
      food.category = category;
      food.price = price;
      food.description = description;
      food.image = image;
      food.isAvailable = isAvailable;

      await updateProduct(id, food);
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

    const deletedFood = await deleteProduct(id);

    return res.json(deletedFood);
  } catch (error) {
    console.log(error);
  }
};
