import express from "express";
import {
  createRestaurant,
  deleteRestaurant,
  getRestaurantById,
  getRestaurantByName,
  getRestaurants,
  RestaurantModel,
  updateRestaurant,
} from "../models/Restaurant.ts";

export const createRestaurantController = async (
  req: express.Request,
  res: express.Response
) => {
  const { name, cnpj, address, logo, specialty, phone, socialName, rating, admin, units, attendants } = req.body;


  // Validação dos campos obrigatórios
  if (!name || !cnpj || !address || !logo || !phone)
    return res.status(400).json({ message: "Campos obrigatórios não fornecidos" });

  try {
    // Verificação de unicidade apenas pelo CNPJ
    const existingRestaurant = await RestaurantModel.findOne({ cnpj });
    if (existingRestaurant) {
      return res.status(400).json({ message: "Já existe um restaurante cadastrado com este CNPJ" });
    }

    // Criação do restaurante
    const restaurant = await createRestaurant({
      name,
      logo,
      cnpj,
      socialName,
      address,
      rating,
      specialty,
      phone,
      admin,
      units: units || [],
      attendants: attendants || []
    });

    res.status(201).json(restaurant).end();
  } catch (error) {
    console.log("Erro: ", error);
    res.status(500).json({ message: "Erro ao criar restaurante", error });
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
    console.error("Erro ao buscar restaurantes:", error);
    return res.status(500).json({ message: "Erro ao buscar restaurantes", error });
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
      return res.status(404).json({ message: "Restaurante não encontrado" });
    }

    res.json(restaurant);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao buscar restaurante", error });
  }
};

// No controlador
export const getRestaurantBySlugController = async (req: express.Request, res: express.Response) => {
  try {
    const { slug } = req.params;

    // Converter slug para nome (substituindo traços por espaços)
    const name = slug.replace(/-/g, ' ');

    // Buscar por nome (case insensitive)
    const restaurant = await RestaurantModel.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') }
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurante não encontrado" });
    }

    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar restaurante" });
  }
};

export const updateRestaurantController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const { name, cnpj, address, logo, specialty, phone, socialName, rating, admin, units, attendants } = req.body;

    // Verificar se o restaurante existe
    const existingRestaurant = await getRestaurantById(id);
    if (!existingRestaurant) {
      return res.status(404).json({ message: "Restaurante não encontrado" });
    }

    // Criar objeto com valores a serem atualizados
    const updateValues: Record<string, any> = {};

    if (name) updateValues.name = name;
    if (logo) updateValues.logo = logo;
    if (cnpj) updateValues.cnpj = cnpj;
    if (socialName) updateValues.socialName = socialName;
    if (address) updateValues.address = address;
    if (rating !== undefined) updateValues.rating = rating;
    if (specialty) updateValues.specialty = specialty;
    if (phone) updateValues.phone = phone;
    if (admin) updateValues.admin = admin;
    if (units) updateValues.units = units;
    if (attendants) updateValues.attendants = attendants;

    // Aplicar a atualização
    const updatedRestaurant = await updateRestaurant(id, updateValues);

    return res.status(200).json(updatedRestaurant || { message: "Restaurante atualizado com sucesso" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao atualizar restaurante", error });
  }
};

export const deleteRestaurantController = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;

    const existingRestaurant = await getRestaurantById(id);
    if (!existingRestaurant) {
      return res.status(404).json({ message: "Restaurante não encontrado" });
    }

    const deletedRestaurant = await deleteRestaurant(id);

    return res.status(200).json({ message: "Restaurante excluído com sucesso", deletedRestaurant });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao excluir restaurante", error });
  }
};