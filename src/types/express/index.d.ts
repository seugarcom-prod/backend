// src/types/express/index.d.ts
import { UserModel } from '../../models/User';
import { RestaurantModel } from '../../models/Restaurant';

declare global {
    namespace Express {
        interface Request {
            user?: UserModel; // Para usuários regulares
            restaurant?: RestaurantModel; // Para restaurantes
            isRestaurantAdmin?: boolean; // Flag para indicar se é admin de restaurante
            identity?: UserModel; // Se você ainda precisa disso por compatibilidade
        }
    }
}