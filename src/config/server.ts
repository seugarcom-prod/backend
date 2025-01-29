import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerJSDoc from "../swagger.json";
import swaggerUI from "swagger-ui-express";
import cookieParser from "cookie-parser";
import router from "../routes/index.ts";
import { connectToDb } from "./db.ts"; // Importa a função de conexão

// Configuração do dotenv
dotenv.config({ path: ".env" });

const app = express();

// Middlewares
app.use(
    cors({
        origin: "http://localhost:3000", // Substitua pelo domínio do seu frontend
        credentials: true,
    })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentação Swagger
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJSDoc));

// Conecta ao banco de dados
connectToDb();

// Tratamento de erros global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Erro interno no servidor." });
});

// Rotas
app.use("/", router());

// Inicialização do servidor
const PORT = process.env.PORT || 3333;
const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});