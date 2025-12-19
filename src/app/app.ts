import express from 'express';
import cors from 'cors';
import { AppDataSource } from 'db/data-source';
import { logger } from '@utils/logger';
import { BotService } from '@bot/bot';
import "reflect-metadata"

const app = express();
const botService = new BotService();

AppDataSource.initialize()
	.then(() => { logger.info(`Successfully connected db ✅ `) })
	.catch((err) => { logger.error(`DB ERROR: ${err} `) })

// 
const appStart = async () => {
	try {
		// Middleware
		app.use(cors());
		app.use(express.json());

		await botService.init()

		// Health Check
		app.get('/health', (_req, res) => {
			res.json({ message: 'Server is running' });
		});
	} catch (error) {
		console.error(error)
	}
}

appStart()

export default app;
