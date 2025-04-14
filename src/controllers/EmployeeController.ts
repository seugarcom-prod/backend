// controllers/EmployeeController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { UserModel } from "../models/User";
import { RestaurantUnitModel } from "../models/RestaurantUnit";
import { createUser, getUserById, deleteUser } from "../models/User";
import { authentication, random } from "../helpers";

// Listar funcionários de uma unidade específica
export const getEmployeesByUnitController = async (req: Request, res: Response) => {
    try {
        const { unitId } = req.params;

        // Verifica se o ID da unidade é válido
        if (!mongoose.Types.ObjectId.isValid(unitId)) {
            return res.status(400).json({
                message: "ID de unidade inválido"
            });
        }

        // Verifica se a unidade existe
        const unit = await RestaurantUnitModel.findById(unitId);
        if (!unit) {
            return res.status(404).json({
                message: "Unidade não encontrada"
            });
        }

        // Busca todos os funcionários com função diferente de CLIENT
        const employees = await UserModel.find({
            restaurantUnits: unitId,
            role: { $ne: "CLIENT" }
        }).select("-authentication.password -authentication.salt");

        return res.status(200).json(employees);
    } catch (error: any) {
        console.error("Erro ao buscar funcionários:", error);
        return res.status(500).json({
            message: error.message || "Erro interno no servidor"
        });
    }
};

// Obter detalhes de um funcionário específico
export const getEmployeeByIdController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Verifica se o ID é válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de funcionário inválido"
            });
        }

        // Busca o funcionário
        const employee = await UserModel.findOne({
            _id: id,
            role: { $ne: "CLIENT" }
        }).select("-authentication.password -authentication.salt");

        if (!employee) {
            return res.status(404).json({
                message: "Funcionário não encontrado"
            });
        }

        return res.status(200).json(employee);
    } catch (error: any) {
        console.error("Erro ao buscar funcionário:", error);
        return res.status(500).json({
            message: error.message || "Erro interno no servidor"
        });
    }
};

// Criar um novo funcionário
export const createEmployeeController = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, phone, password, role, unitId } = req.body;

        // Verifica campos obrigatórios
        if (!firstName || !lastName || !email || !role || !unitId) {
            return res.status(400).json({
                message: "Todos os campos obrigatórios devem ser preenchidos"
            });
        }

        // Verifica se a unidade existe
        if (!mongoose.Types.ObjectId.isValid(unitId)) {
            return res.status(400).json({
                message: "ID de unidade inválido"
            });
        }

        const unit = await RestaurantUnitModel.findById(unitId);
        if (!unit) {
            return res.status(404).json({
                message: "Unidade não encontrada"
            });
        }

        // Verifica se o email já está em uso
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "Email já está em uso"
            });
        }

        // Valida o tipo de função
        const validRoles = ["ADMIN", "MANAGER", "ATTENDANT"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                message: "Função inválida. Use ADMIN, MANAGER ou ATTENDANT"
            });
        }

        // Cria o hash da senha
        const salt = random();
        const hashedPassword = authentication(salt, password);

        // Cria o novo funcionário
        const newEmployee = new UserModel({
            firstName,
            lastName,
            email,
            phone: phone || "",
            role,
            authentication: {
                password: hashedPassword,
                salt,
                sessionToken: "",
            },
            restaurantUnits: [unitId],
            orders: []
        });

        await newEmployee.save();

        // Adiciona o funcionário à unidade, se ainda não estiver adicionado
        await RestaurantUnitModel.findByIdAndUpdate(
            unitId,
            {
                $addToSet: { staff: newEmployee._id }
            },
            { new: true }
        );

        // Retorna o funcionário sem dados sensíveis
        const employeeToReturn = { ...newEmployee.toObject() };
        if (employeeToReturn.authentication) {
            delete employeeToReturn.authentication.password;
            delete employeeToReturn.authentication.salt;
        }

        return res.status(201).json(employeeToReturn);
    } catch (error: any) {
        console.error("Erro ao criar funcionário:", error);
        return res.status(500).json({
            message: error.message || "Erro interno no servidor"
        });
    }
};

// Atualizar um funcionário existente
export const updateEmployeeController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phone, role, password } = req.body;

        // Verifica se o ID é válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de funcionário inválido"
            });
        }

        // Verifica se o funcionário existe
        const employee = await UserModel.findOne({
            _id: id,
            role: { $ne: "CLIENT" }
        });

        if (!employee) {
            return res.status(404).json({
                message: "Funcionário não encontrado"
            });
        }

        // Verifica se o email está sendo alterado e já existe
        if (email && email !== employee.email) {
            const existingUserWithEmail = await UserModel.findOne({ email });
            if (existingUserWithEmail) {
                return res.status(400).json({
                    message: "Email já está em uso"
                });
            }
        }

        // Prepara os dados para atualização
        const updateData: any = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (role) {
            const validRoles = ["ADMIN", "MANAGER", "ATTENDANT"];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    message: "Função inválida. Use ADMIN, MANAGER ou ATTENDANT"
                });
            }
            updateData.role = role;
        }

        // Atualiza a senha se fornecida
        if (password) {
            const salt = random();
            const hashedPassword = authentication(salt, password);
            updateData["authentication.password"] = hashedPassword;
            updateData["authentication.salt"] = salt;
        }

        // Atualiza o funcionário
        const updatedEmployee = await UserModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).select("-authentication.password -authentication.salt");

        return res.status(200).json(updatedEmployee);
    } catch (error: any) {
        console.error("Erro ao atualizar funcionário:", error);
        return res.status(500).json({
            message: error.message || "Erro interno no servidor"
        });
    }
};

// Excluir um funcionário
export const deleteEmployeeController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Verifica se o ID é válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de funcionário inválido"
            });
        }

        // Busca o funcionário para verificar se existe e se não é o último ADMIN
        const employee = await UserModel.findOne({
            _id: id,
            role: { $ne: "CLIENT" }
        });

        if (!employee) {
            return res.status(404).json({
                message: "Funcionário não encontrado"
            });
        }

        // Se for um ADMIN, verifica se é o último
        if (employee.role === "ADMIN") {
            const adminsCount = await UserModel.countDocuments({ role: "ADMIN" });
            if (adminsCount <= 1) {
                return res.status(400).json({
                    message: "Não é possível excluir o último administrador"
                });
            }
        }

        // Remove o funcionário das unidades em que ele trabalha
        await RestaurantUnitModel.updateMany(
            { staff: id },
            { $pull: { staff: id } }
        );

        // Exclui o funcionário
        await UserModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Funcionário excluído com sucesso"
        });
    } catch (error: any) {
        console.error("Erro ao excluir funcionário:", error);
        return res.status(500).json({
            message: error.message || "Erro interno no servidor"
        });
    }
};