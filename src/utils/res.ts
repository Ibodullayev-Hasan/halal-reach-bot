import { Context } from "telegraf";

export const botResSchema = async (ctx: Context, message?: string): Promise<void> => {
	try {
		await ctx.reply(
			message,
			{ reply_markup: { remove_keyboard: true } }
		);
	} catch (error: any) {
		ctx.reply(`Nimadir xato ketdi 🥶\n Biroz kuting va qayta urining 😊`)
	}
}