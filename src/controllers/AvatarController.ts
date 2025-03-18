// controllers/AvatarController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import formidable from 'formidable';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../models/User';

export const config = {
    api: {
        bodyParser: false,
    },
};

const AVATAR_DIR = path.join(process.cwd(), 'public/avatars');

if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

export const uploadAvatar = async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ msg: 'Método não permitido' });
    }

    const form = formidable({
        uploadDir: AVATAR_DIR,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Erro no upload:', err);
            return res.status(500).json({ msg: 'Erro ao processar o upload' });
        }

        try {
            const file = files.avatar?.[0];

            if (!file) {
                return res.status(400).json({ msg: 'Nenhum arquivo enviado' });
            }

            const avatarId = uuidv4();

            const fileExt = path.extname(file.originalFilename || '');
            const newFileName = `${avatarId}${fileExt}`;
            const newPath = path.join(AVATAR_DIR, newFileName);

            fs.renameSync(file.filepath, newPath);

            res.status(200).json({
                msg: 'Avatar enviado com sucesso',
                avatarId,
                avatarUrl: `/avatars/${newFileName}`
            });
        } catch (error) {
            console.error('Erro ao processar avatar:', error);
            res.status(500).json({ msg: 'Erro ao processar o upload do avatar' });
        }
    });
};

export const removeAvatar = async (req: Request, res: Response) => {
    try {
        const { avatarId } = req.body;

        if (!avatarId) {
            return res.status(400).json({ msg: 'ID do avatar não fornecido' });
        }

        const files = fs.readdirSync(AVATAR_DIR);
        const avatarFile = files.find(file => file.startsWith(avatarId));

        if (!avatarFile) {
            return res.status(404).json({ msg: 'Avatar não encontrado' });
        }

        fs.unlinkSync(path.join(AVATAR_DIR, avatarFile));

        if (req.params.userId) {
            const user = await UserModel.findById(req.params.userId);
            if (user && user.avatar === avatarId) {
                user.avatar = avatarId;
                await user.save();
            }
        }

        res.status(200).json({ msg: 'Avatar removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover avatar:', error);
        res.status(500).json({ msg: 'Erro ao remover o avatar' });
    }
};

export const getAvatar = async (req: Request, res: Response) => {
    try {
        let userId = req.params.userId;

        if (!userId && req.params.userId) {
            userId = req.params.userId;
        }

        if (!userId) {
            return res.status(400).json({ msg: 'ID do usuário não fornecido' });
        }

        const user = await UserModel.findById(userId);

        if (!user || !user.avatar) {
            return res.status(404).json({ msg: 'Avatar não encontrado' });
        }

        const files = fs.readdirSync(AVATAR_DIR);
        const avatarFile = files.find(file => file.startsWith(user.avatar));

        if (!avatarFile) {
            return res.status(404).json({ msg: 'Arquivo de avatar não encontrado' });
        }

        res.status(200).json({
            avatarId: user.avatar,
            avatarUrl: `/avatars/${avatarFile}`
        });
    } catch (error) {
        console.error('Erro ao obter avatar:', error);
        res.status(500).json({ msg: 'Erro ao obter o avatar' });
    }
};