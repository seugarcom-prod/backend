// helpers/index.ts
import crypto from 'crypto';

/**
 * Gera uma string aleatória para uso como salt
 */
export const random = () => crypto.randomBytes(128).toString('base64');

/**
 * Cria um hash a partir de um salt e senha
 * @param salt String aleatória usada para aumentar a segurança do hash
 * @param password Senha ou string a ser processada
 * @returns Hash resultante em formato hexadecimal
 */
export const authentication = (salt: string, password: string) => {
  return crypto.createHmac('sha256', [salt, password].join('/')).update(process.env.SECRET_KEY || 'SECRET_KEY').digest('hex');
};

/**
 * Verifica se uma senha fornecida corresponde ao hash armazenado
 * @param storedSalt Salt armazenado no banco de dados
 * @param storedHash Hash armazenado no banco de dados
 * @param suppliedPassword Senha fornecida pelo usuário
 * @returns Booleano indicando se a senha está correta
 */
export const verifyPassword = (storedSalt: string, storedHash: string, suppliedPassword: string) => {
  const suppliedHash = authentication(storedSalt, suppliedPassword);
  return storedHash === suppliedHash;
};