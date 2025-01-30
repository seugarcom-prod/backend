import { Request, Response, NextFunction } from "express";
import { get } from "lodash";

interface AuthenticatedUser {
    role: string;
}

export const hasRole = (requiredRole: string) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const identity = get(req, "identity");
            if (!identity) {
                return res.sendStatus(403); // Usuário não autenticado
            }
            const user = identity as AuthenticatedUser; // Força o tipo para AuthenticatedUser

            if (!user) {
                return res.sendStatus(403); // Usuário não autenticado
            }

            const userRole = user.role; // Agora o TypeScript sabe que user.role existe

            // Verifica se o usuário tem a role necessária
            if (userRole !== requiredRole) {
                return res.sendStatus(403); // Acesso negado
            }

            next(); // Permite o acesso à rota
        } catch (error) {
            console.error(error);
            return res.sendStatus(400); // Erro interno do servidor
        }
    };
};