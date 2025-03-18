// src/utils/fileStorage.ts
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Diretório base para armazenamento de arquivos
const STORAGE_DIR = path.join(process.cwd(), 'public');

/**
 * Faz upload de um arquivo
 * @param sourcePath Caminho do arquivo temporário
 * @param fileName Nome do arquivo final (opcional)
 * @param subDirectory Subdiretório para salvar o arquivo (opcional)
 * @returns URL do arquivo salvo
 */
export const uploadFile = async (
    sourcePath: string,
    fileName: string = '',
    subDirectory: string = 'uploads'
): Promise<string> => {
    try {
        // Cria diretório se não existir
        const targetDir = path.join(STORAGE_DIR, subDirectory);
        await fs.mkdir(targetDir, { recursive: true });

        // Gera um nome de arquivo se não for fornecido
        const targetFileName = fileName || `${uuidv4()}${path.extname(sourcePath)}`;
        const targetPath = path.join(targetDir, targetFileName);

        // Copia o arquivo para o destino final
        await fs.copyFile(sourcePath, targetPath);

        // Retorna URL relativa do arquivo
        return `/${subDirectory}/${targetFileName}`;
    } catch (error) {
        console.error('Erro ao salvar arquivo:', error);
        throw error;
    }
};

/**
 * Exclui um arquivo pelo caminho
 * @param fileUrl URL do arquivo a ser excluído
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
    try {
        // Remove a barra inicial da URL para obter um caminho relativo
        const relativePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;

        // Constrói o caminho completo para o arquivo
        const filePath = path.join(STORAGE_DIR, relativePath);

        // Verifica se o arquivo existe
        try {
            await fs.access(filePath);
        } catch (error) {
            console.warn(`Arquivo não encontrado para exclusão: ${filePath}`);
            return; // Se o arquivo não existe, não há necessidade de excluí-lo
        }

        // Exclui o arquivo
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Erro ao excluir arquivo:', error);
        throw error;
    }
};

/**
 * Obtém o caminho completo para um arquivo a partir da URL
 * @param fileUrl URL do arquivo
 * @returns Caminho completo para o arquivo
 */
export const getFilePath = (fileUrl: string): string => {
    const relativePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    return path.join(STORAGE_DIR, relativePath);
};