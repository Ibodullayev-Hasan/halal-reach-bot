import "dotenv/config"

const {
	PORT,
	BOT_TOKEN,
	DB_URL,
	NODE_ENV,
	BOT_WELCOME,
	BOT_HELP_TEXT_ADMIN,
	BOT_HELP_TEXT_CLIENT
} = process.env

export const environments = {
	PORT,
	BOT_TOKEN,
	DB_URL,
	NODE_ENV,
	BOT_WELCOME,
	BOT_HELP_TEXT_ADMIN,
	BOT_HELP_TEXT_CLIENT
}