// routes/EmployeeRoutes.ts
import { Router } from "express";
import {
    getEmployeesByUnitController,
    getEmployeeByIdController,
    createEmployeeController,
    updateEmployeeController,
    deleteEmployeeController,
    getEmployeesByRestaurantController
} from "../controllers/EmployeeController";
import {
    isAuthenticated,
    hasRole,
} from "../middlewares/index";

export default (router: Router) => {
    // Listar todos os funcionários de um restaurante (requer ser admin)
    router.get(
        "/restaurant/:id/employees",
        isAuthenticated,
        hasRole('ADMIN'),
        getEmployeesByRestaurantController
    );

    // Listar todos os funcionários de uma unidade (requer ser admin ou gerente)
    router.get(
        "/unit/:unitId/employees",
        isAuthenticated,
        hasRole('ADMIN'),
        getEmployeesByUnitController
    );

    // Obter um funcionário específico por ID (requer ser admin ou gerente)
    router.get(
        "/employee/:id",
        isAuthenticated,
        hasRole('ADMIN'),
        getEmployeeByIdController
    );

    // Criar um novo funcionário (requer ser admin)
    router.post(
        "/restaurant/:id/unit/:unitId/employee/create",
        isAuthenticated,
        hasRole('ADMIN'),
        createEmployeeController
    );

    // Atualizar um funcionário existente (requer ser admin)
    router.patch(
        "/employee/:id/update",
        isAuthenticated,
        updateEmployeeController
    );

    // Excluir um funcionário (requer ser admin)
    router.delete(
        "/employee/:id/delete",
        isAuthenticated,
        deleteEmployeeController
    );
};