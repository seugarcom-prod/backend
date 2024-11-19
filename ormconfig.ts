import { DataSource } from "typeorm";

export const connectionSource = new DataSource({
  migrationsTableName: "migrations",
  type: "postgres",
  host: "localhost",
  port: 3333,
  username: "admin",
  password: "admin",
  database: "SeuGarcom",
  logging: false,
  synchronize: false,
  name: "SeuGarcomTeste",
  entities: ["src/**/**.entity{.ts,.js}"],
  migrations: ["src/migrations/**/*{.ts,.js}"],
  subscribers: ["src/subscriber/**/*{.ts,.js}"],
});
