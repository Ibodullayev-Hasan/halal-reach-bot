import app from '@app/app';
import { environments } from '@config/index';
import { logger } from '@utils/logger';


const startServer = async (): Promise<void> => {
	try {

		app.listen(environments.PORT, () => {
			logger.info(`Server is running on http://localhost:${environments.PORT}`);
		});

	} catch (err) {
		logger.error('Database connection failed:', err);
		process.exit(1);
	}
};

startServer();
