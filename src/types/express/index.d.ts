import { UserModel } from '../../models/User'; // Ajuste o caminho conforme necessário

declare global {
    namespace Express {
        interface Request {
            identity?: UserModel; // Use o tipo correto do seu modelo de usuário
        }
    }
}