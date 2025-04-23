// controllers/ProductController.ts (ajustado)
import express from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductByName,
  getProductsByRestaurant,
  getPromotionalProducts,
  updateProduct
} from "../models/Products.ts";

export const createFoodController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id: restaurantId } = req.params;

    const {
      name,
      category,
      description,
      price,
      image,
      quantity,
      isOnPromotion,
      discountPercentage,
      promotionalPrice,
      promotionStartDate,
      promotionEndDate
    } = req.body;

    // Verificações básicas
    if (!name || !restaurantId || !category || !price) {
      return res.status(400).json({ message: "Campos obrigatórios ausentes" });
    }

    // Verificar se já existe produto com o mesmo nome
    const sameName = await getProductByName(name);
    if (sameName) {
      return res.status(400).json({ message: "Já existe um produto com este nome" });
    }

    // Cálculo do preço promocional se não for fornecido
    let calculatedPromotionalPrice = promotionalPrice;
    if (isOnPromotion && discountPercentage && !promotionalPrice) {
      calculatedPromotionalPrice = price - (price * (discountPercentage / 100));
    }

    const productData = {
      restaurant: restaurantId,
      name,
      category,
      description,
      price,
      image,
      quantity,
      isOnPromotion: isOnPromotion || false,
      discountPercentage,
      promotionalPrice: calculatedPromotionalPrice,
      promotionStartDate,
      promotionEndDate
    };

    const newFood = await createProduct(productData);
    return res.status(201).json(newFood);
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return res.status(500).json({ message: "Erro ao criar produto" });
  }
};

export const getAllFoodsController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id: restaurantId } = req.params;

    const foods = await getProductsByRestaurant(restaurantId);

    return res.status(200).json(foods);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return res.status(500).json({ message: "Erro ao buscar produtos" });
  }
};

export const getFoodByIdController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return res.status(500).json({ message: "Erro ao buscar produto" });
  }
};

export const updateFoodController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      price,
      description,
      image,
      isAvailable,
      isOnPromotion,
      discountPercentage,
      promotionalPrice,
      promotionStartDate,
      promotionEndDate
    } = req.body;

    // Verificar se o produto existe
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    // Cálculo do preço promocional se fornecido desconto
    let calculatedPromotionalPrice = promotionalPrice;
    if (isOnPromotion && discountPercentage && !promotionalPrice) {
      calculatedPromotionalPrice = price - (price * (discountPercentage / 100));
    }

    const updatedData = {
      name,
      category,
      price,
      description,
      image,
      isAvailable,
      isOnPromotion: isOnPromotion || false,
      ...(isOnPromotion ? {
        discountPercentage,
        promotionalPrice: calculatedPromotionalPrice,
        promotionStartDate,
        promotionEndDate
      } : {
        discountPercentage: null,
        promotionalPrice: null,
        promotionStartDate: null,
        promotionEndDate: null
      })
    };

    const updatedProduct = await updateProduct(id, updatedData);
    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return res.status(500).json({ message: "Erro ao atualizar produto" });
  }
};

export const deleteFoodController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const deletedFood = await deleteProduct(id);
    return res.status(200).json({ message: "Produto excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return res.status(500).json({ message: "Erro ao excluir produto" });
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
      if (!product.name || !product.price) {
        return res.status(400).json({
          message: "Campos obrigatórios ausentes",
          product
        });
      }

      // Cálculo do preço promocional se necessário
      if (product.isOnPromotion && product.discountPercentage && !product.promotionalPrice) {
        product.promotionalPrice = product.price - (product.price * (product.discountPercentage / 100));
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