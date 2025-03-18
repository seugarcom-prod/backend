// middlewares/auth.ts
import express from 'express';
import { get, merge } from 'lodash';
import { getUserBySessionToken } from '../models/User';

export const isOwner = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { id } = req.params;
        const currentUserId = get(req, 'identity._id');
        if (typeof currentUserId !== 'string') {
            return res.status(403).json({ message: "Não autorizado" });
        }

        if (!currentUserId) {
            return res.status(403).json({ message: "Não autorizado" });
        }

        if (currentUserId !== id) {
            return res.status(403).json({ message: "Não autorizado" });
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Erro ao verificar proprietário" });
    }
};

export const isAuthenticated = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        // Verificar se há um token na requisição
        const sessionToken = req.cookies['SESSION_TOKEN'] || req.headers['authorization']?.split(' ')[1];

        if (!sessionToken) {
            return res.status(403).json({ message: "Não autenticado" });
        }

        // Buscar usuário pelo token de sessão
        const existingUser = await getUserBySessionToken(sessionToken);

        if (!existingUser) {
            return res.status(403).json({ message: "Não autenticado" });
        }

        // Adicionar o usuário à requisição para uso posterior
        merge(req, { identity: existingUser });

        return next();
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Erro na autenticação" });
    }
};

export const isAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const currentUserRole = get(req, 'identity.role');

        if (!currentUserRole || currentUserRole !== 'ADMIN') {
            return res.status(403).json({ message: "Acesso restrito a administradores" });
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Erro ao verificar permissão de administrador" });
    }
};

export const isAttendant = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const currentUserRole = get(req, 'identity.role');

        if (!currentUserRole || (currentUserRole !== 'ATTENDANT' && currentUserRole !== 'ADMIN')) {
            return res.status(403).json({ message: "Acesso restrito a atendentes" });
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Erro ao verificar permissão de atendente" });
    }
};