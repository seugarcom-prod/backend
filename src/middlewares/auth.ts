// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { RestaurantModel } from '../models/Restaurant';

interface JwtPayload {
    sub: string;      // ID do usuário ou restaurante
    email: string;    // Email
    role: string;     // Role (ou "RESTAURANT" para restaurantes)
    iat: number;      // Issued at
    exp: number;      // Expiration
}

// Adicionar type declarations para incluir o usuário/restaurante nas requisições
declare global {
    namespace Express {
        interface Request {
            user?: any;
            restaurant?: any;
            isRestaurantAdmin?: boolean;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_in_production";

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Token de autenticação não fornecido' });
        }

        const token = authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

        // Verificar token JWT
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Determinar se é um restaurante ou usuário normal baseado no campo role
        if (decoded.role === 'RESTAURANT') {
            // Buscar restaurante
            const restaurant = await RestaurantModel.findById(decoded.sub)
                .select('+authentication.sessionToken');

            if (!restaurant) {
                return res.status(401).json({ message: 'Restaurante não encontrado' });
            }

            // Verificar se o token armazenado corresponde ao token fornecido
            if (!restaurant.authentication || restaurant.authentication.sessionToken !== token) {
                return res.status(401).json({ message: 'Sessão inválida' });
            }

            // Adicionar informações do restaurante à requisição
            req.restaurant = restaurant;
            req.isRestaurantAdmin = true;
            next();
        } else {
            // É um usuário normal (MANAGER, ATTENDANT, CLIENT)
            const user = await UserModel.findById(decoded.sub);

            if (!user) {
                return res.status(401).json({ message: 'Usuário não encontrado' });
            }

            // Verificar se o token armazenado corresponde ao token fornecido
            if (!user.authentication || user.authentication.sessionToken !== token) {
                return res.status(401).json({ message: 'Sessão inválida' });
            }

            // Adicionar o usuário ao objeto de requisição para uso downstream
            req.user = user;
            req.isRestaurantAdmin = false;
            next();
        }
    } catch (error) {
        console.error('Erro de autenticação:', error);
        res.status(401).json({ message: 'Token inválido ou expirado' });
    }
};

// Middleware para verificar se é admin do restaurante
export const isRestaurantAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isRestaurantAdmin && req.restaurant) {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas administradores de restaurante têm permissão.' });
    }
};

// Middleware para verificar se o usuário é um gerente
export const isManager = (req: Request, res: Response, next: NextFunction) => {
    if (req.isRestaurantAdmin || (req.user && req.user.role === 'MANAGER')) {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Permissão insuficiente.' });
    }
};

// Middleware para verificar se é um atendente ou superior
export const isAttendantOrAbove = (req: Request, res: Response, next: NextFunction) => {
    if (
        req.isRestaurantAdmin ||
        (req.user && ['MANAGER', 'ATTENDANT'].includes(req.user.role))
    ) {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Permissão insuficiente.' });
    }
};