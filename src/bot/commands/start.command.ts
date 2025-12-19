import { Context, Markup } from "telegraf";
import { environments } from "@config/environments";
import { UserRoles } from "enums/roles.enum";
import { removeKeyboard } from "telegraf/typings/markup";

export class StartCommand {
	constructor() { }

	async startMessage(ctx: Context & { user?: { role: UserRoles } }) {
		try {
			const welcome = environments.BOT_WELCOME;
			const firstName = ctx.from?.first_name ?? "Mehmon";

			// ✅ Inline keyboardni to‘g‘ri yaratish
			const keyboard = Markup.inlineKeyboard([
				[Markup.button.callback("✅ Roziman", "accept")]
			]);

			await ctx.reply(
				`${welcome} ${firstName}, botdan foydalanish uchun rozilik bildiring 👇`,
				keyboard
			);

			// set bot menu 
			if (!ctx.user) {
				await ctx.telegram.setMyCommands(
					[{ command: "start", description: "Start the bot" }],
					{
						scope: { type: "chat", chat_id: ctx.chat!.id },
					}
				)
			}
		} catch (error) {
			console.error("❌ Start xatolik:", error);
			await ctx.reply(
				`Nimadir xato ketdi 🥶\nBiroz kuting va qayta urinib ko‘ring 😊`
			);
		}
	}
}
