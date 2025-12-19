import { userRepo } from "db/repositories";
import { Context } from "telegraf";

export const isExisting = async (ctx: Context, next: () => Promise<void>): Promise<void> => {

	const user = await userRepo.findOne({ where: { telegramId: ctx.from.id } })

	if (user) return

	await next()
}