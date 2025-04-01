import { Router } from "express";
import {
  loginHandler,
  registerClientHandler,
  registerManagerHandler,
  registerAdminWithRestaurantHandler,
  validateTokenHandler,
  logoutHandler,
  validateGuestTokenHandler,
  loginAdminHandler,
  loginUserHandler,
} from "../controllers/AuthenticationController";
import { isAuthenticated, isRestaurantAdmin, isManager } from "../middlewares";

export default (router: Router) => {
  // Rota de login unificada
  router.post("/login", loginHandler);

  // Rotas específicas para cada tipo
  router.post("/login/admin", loginAdminHandler);
  router.post("/login/user", loginUserHandler);

  // Cadastro de restaurante - via página pública
  router.post("/register/restaurant", registerAdminWithRestaurantHandler);

  // Cadastro de cliente - via página pública
  router.post("/register/client", registerClientHandler);

  // Cadastro de gerente - apenas por restaurante admin
  router.post(
    "/register/manager",
    isAuthenticated,
    isRestaurantAdmin,
    registerManagerHandler
  );

  // Cadastro de atendente - por restaurante admin ou gerente
  router.post(
    "/register/attendant",
    isAuthenticated,
    isManager,
    registerManagerHandler
  );

  // Verificação de token
  router.get("/validate", isAuthenticated, validateTokenHandler);

  // Validação de token de convidado
  router.post("/validate/guest", validateGuestTokenHandler);

  // Logout
  router.post("/logout", isAuthenticated, logoutHandler);

  return router;
};