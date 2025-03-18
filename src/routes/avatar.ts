// src/routes/avatarRoutes.ts
import express, { Request } from 'express';
import multer from 'multer';
import { uploadAvatar, removeAvatar, getAvatar } from '../controllers/AvatarController';
import { isAuthenticated } from '../middlewares/auth';

const router = express.Router();

type FileFilterCallback = multer.FileFilterCallback;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './tmp/uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const fileExt = file.originalname.split('.').pop();
        cb(null, `avatar-${uniqueSuffix}.${fileExt}`);
    }
});


const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        console.error("Arquivo rejeitado:", file.originalname, file.mimetype);
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    }
});


router.post('/avatar/upload', isAuthenticated, upload.single('avatar'), uploadAvatar);
router.post('/avatar/remove', isAuthenticated, removeAvatar);
router.get('/:userId?/avatar', getAvatar);

export default router;