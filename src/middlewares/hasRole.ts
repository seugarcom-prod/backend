// hasRole.ts

import { Request, Response, NextFunction } from "express";
import { get } from "lodash";

type UserRole = 'ADMIN' | 'MANAGER' | 'ATTENDANT' | 'CLIENT';

interface AuthenticatedUser {
    role: UserRole;
}

export const hasRole = (requiredRoles: UserRole | UserRole[]) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const identity = get(req, "identity");

            if (!identity) {
                return res.status(403).json({
                    message: "Acesso negado: usuário não autenticado"
                });
            }

            const user = identity as AuthenticatedUser;

            if (!user || !user.role) {
                return res.status(403).json({
                    message: "Acesso negado: roles não encontradas"
                });
            }

            // Converte requiredRoles para array se for string única
            const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

            // Verifica se o usuário tem pelo menos uma das roles necessárias
            const hasRequiredRole = roles.includes(user.role);

            if (!hasRequiredRole) {
                return res.status(403).json({
                    message: "Acesso negado: permissões insuficientes",
                    required: roles,
                    current: user.role
                });
            }

            next();
        } catch (error) {
            console.error('Erro na verificação de roles:', error);
            return res.status(500).json({
                message: "Erro interno ao verificar permissões"
            });
        }
    };
};