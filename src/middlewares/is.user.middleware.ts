import { userRepo } from "db/repositories";
import { Context } from "telegraf";

export const isUser = async (ctx: Context, next: () => Promise<void>): Promise<void> => {
	const user = await userRepo.findOne({ where: { telegramId: ctx.from.id } })

	if (!user) {
		await ctx.reply("❌ Error: Please register first by clicking /start")
		return
	}

	await next()
}