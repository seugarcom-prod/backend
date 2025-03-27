import { Request, Response } from "express";
import {
  createRestaurantUnit,
  deleteRestaurantUnit,
  getRestaurantUnits,
  getRestaurantUnitById,
  updateRestaurantUnit,
  RestaurantUnitModel,
} from "../models/RestaurantUnit.ts";
import { getRestaurantById, RestaurantModel, updateRestaurant } from "../models/Restaurant.ts";

export const addRestaurantUnitHandler = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const unitData = req.body;

    // Verificar se o restaurante existe
    const restaurant = await RestaurantModel.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurante não encontrado" });
    }

    // Criar a unidade
    const unit = new RestaurantUnitModel({
      ...unitData,
      restaurant: restaurantId
    });

    const savedUnit = await unit.save();

    // Atualizar o restaurante com referência à unidade
    await RestaurantModel.findByIdAndUpdate(
      restaurantId,
      { $push: { units: savedUnit._id } }
    );

    return res.status(201).json({
      message: "Unidade adicionada com sucesso",
      unit: savedUnit
    });
  } catch (error: any) {
    console.error("Erro ao adicionar unidade:", error);
    return res.status(500).json({ message: "Erro interno do servidor", error: error.message });
  }
};

export const getAllRestaurantUnitsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { restaurantId } = req.params;

    // Se um restaurantId for fornecido, obtenha apenas as unidades desse restaurante
    if (restaurantId) {
      const restaurant = await getRestaurantById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurante não encontrado" });
      }

      // Popula as unidades do restaurante
      await restaurant.populate('units');
      return res.status(200).json(restaurant.units);
    }

    // Caso contrário, obtenha todas as unidades
    const restaurantUnits = await getRestaurantUnits();
    return res.status(200).json(restaurantUnits);
  } catch (error) {
    console.error("Erro ao buscar unidades:", error);
    return res.status(500).json({ message: "Erro ao buscar unidades de restaurante", error });
  }
};

export const getRestaurantUnitByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { unitId } = req.params;
    const restaurantUnit = await getRestaurantUnitById(unitId);

    if (!restaurantUnit) {
      return res.status(404).json({ message: "Unidade de restaurante não encontrada" });
    }

    res.json(restaurantUnit);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao buscar unidade de restaurante", error });
  }
};

export const updateRestaurantUnitController = async (
  req: Request,
  res: Response
) => {
  try {
    const { unitId } = req.params;
    const { address, cnpj, phone, manager, socialName, attendants } = req.body;

    // Verificar se a unidade existe
    const restaurantUnit = await getRestaurantUnitById(unitId);
    if (!restaurantUnit) {
      return res.status(404).json({ message: "Unidade de restaurante não encontrada" });
    }

    // Criar objeto com valores a serem atualizados
    const updateValues: Record<string, any> = {};

    if (address) updateValues.address = address;
    if (cnpj) updateValues.cnpj = cnpj;
    if (phone) updateValues.phone = phone;
    if (manager) updateValues.manager = manager;
    if (socialName) updateValues.socialName = socialName;
    if (attendants) updateValues.attendants = attendants;

    // Aplicar a atualização
    const updatedUnit = await updateRestaurantUnit(unitId, updateValues);

    return res.status(200).json(updatedUnit || { message: "Unidade atualizada com sucesso" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao atualizar unidade de restaurante", error });
  }
};

export const deleteRestaurantUnitController = async (
  req: Request,
  res: Response
) => {
  try {
    const { unitId, restaurantId } = req.params;

    // Verificar se a unidade existe
    const restaurantUnit = await getRestaurantUnitById(unitId);
    if (!restaurantUnit) {
      return res.status(404).json({ message: "Unidade de restaurante não encontrada" });
    }

    // Excluir a unidade
    const deletedUnit = await deleteRestaurantUnit(unitId);

    // Remover referência da unidade no restaurante
    if (restaurantId) {
      await updateRestaurant(restaurantId, {
        $pull: { units: unitId }
      });
    }

    return res.status(200).json({ message: "Unidade excluída com sucesso", deletedUnit });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao excluir unidade de restaurante", error });
  }
};

// Controlador para adicionar um atendente a uma unidade
export const addAttendantToUnitController = async (
  req: Request,
  res: Response
) => {
  try {
    const { unitId } = req.params;
    const { attendantId } = req.body;

    if (!attendantId) {
      return res.status(400).json({ message: "ID do atendente não fornecido" });
    }

    // Verificar se a unidade existe
    const restaurantUnit = await getRestaurantUnitById(unitId);
    if (!restaurantUnit) {
      return res.status(404).json({ message: "Unidade de restaurante não encontrada" });
    }

    // Adicionar atendente à unidade
    await updateRestaurantUnit(unitId, {
      $addToSet: { attendants: attendantId } // Usa $addToSet para evitar duplicatas
    });

    return res.status(200).json({ message: "Atendente adicionado com sucesso à unidade" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao adicionar atendente à unidade", error });
  }
};

// Controlador para remover um atendente de uma unidade
export const removeAttendantFromUnitController = async (
  req: Request,
  res: Response
) => {
  try {
    const { unitId, attendantId } = req.params;

    // Verificar se a unidade existe
    const restaurantUnit = await getRestaurantUnitById(unitId);
    if (!restaurantUnit) {
      return res.status(404).json({ message: "Unidade de restaurante não encontrada" });
    }

    // Remover atendente da unidade
    await updateRestaurantUnit(unitId, {
      $pull: { attendants: attendantId }
    });

    return res.status(200).json({ message: "Atendente removido com sucesso da unidade" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Erro ao remover atendente da unidade", error });
  }
};