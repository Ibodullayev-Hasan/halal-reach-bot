import { DataSource } from "typeorm";
import * as path from "path";
import { environments } from "@config/environments";

export const AppDataSource = new DataSource({
	type: "postgres",
	url: environments.DB_URL as string,
	synchronize: false,

	entities: [path.join(__dirname, "../**/*.entity{.ts,.js}")],

	migrations: [
		path.join(__dirname, "migrations/**/*{.ts,.js}")
	],

	migrationsRun: false,
	migrationsTableName: "migrations"
});
