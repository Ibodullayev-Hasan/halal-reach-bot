import { userRepo } from "db/repositories";
import { Context } from "telegraf";

export const isExisting = async (ctx: Context, next: () => Promise<void>): Promise<void> => {

	const user = await userRepo.findOne({ where: { telegramId: ctx.from.id } })

	if (user) {
		await ctx.reply(`Siz allaqachon ro'yxatdan o'tgansiz! \n/admin\n/profile\n/help kommandalarini birini bering`)
		return
	}

	await next()
}