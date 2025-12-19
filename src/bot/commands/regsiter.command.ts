import { Context, Markup } from "telegraf";
import { UserRoles } from "enums/roles.enum";
import { checkRole } from "middlewares/role.middleware";
import { botResSchema } from "@utils/res";
import { UserFromCtx } from "@bot/user-from-ctx";
import { userRepo } from "db/repositories";
import { userCreate } from "modules/user";

export class RegisterCommand {
	constructor() { }

	// foydalanuvchi "✅ Roziman" tugmasini bosganda
	async userAccept(ctx: Context) {
		try {
			// callback queryga javob berish
			await ctx.answerCbQuery();

			// telefon raqam so‘rovchi keyboard
			const keyboard = Markup.keyboard([
				Markup.button.contactRequest("📱 Telefon raqamni yuborish"),
			]).oneTime().resize(true)

			await ctx.reply(`📞 Iltimos, telefon raqamingizni yuboring: \n     (pastdagi tugmani bosing 👇)`, keyboard);
		} catch (error) {
			console.error("❌ userAccept error:", error);
			await ctx.reply("Xatolik yuz berdi. Qayta urinib ko‘ring 🙏");
		}
	}

	// foydalanuvchini ro'yxatdan o'tkazish
	async register(ctx: Context & { user?: { userRole: UserRoles } }) {
		try {

			const data = UserFromCtx(ctx);
			if (!data) return;

			// foydalanuvchini saqlash
			const newUser = await userCreate(data)

			if (!newUser) { return await ctx.reply("Avval ro'yxatdan o'tgan ❌") }

			// ctx.user ga natijani qo'yish
			(ctx as any).user = newUser;

			await botResSchema(ctx, `✅ ${newUser.firstName} muvaffaqiyatli ro'yxatdan o'tdi`);

			// bot menu ni foydalanuvchi roliga qarab sozlash
			if (ctx.user && checkRole(ctx.user.userRole, [UserRoles.SUPER_ADMIN])) {
				await ctx.telegram.setMyCommands(
					[
						{ command: "profile", description: "Show user profile" },
						{ command: "super_admin", description: "Management panel" },
					],
					{ scope: { type: "chat", chat_id: ctx.chat!.id } }
				);
			}

			if (ctx.user && checkRole(ctx.user.userRole, [UserRoles.CLIENT])) {
				await ctx.telegram.setMyCommands(
					[
						{ command: "profile", description: "Show user profile" },
						{ command: "help", description: "Show help text" },
					],
					{ scope: { type: "chat", chat_id: ctx.chat!.id } }
				);
			}
		} catch (error) {
			console.error("❌ register error:", error);
			await ctx.reply(
				"Nimadir xato ketdi 🥶\nBiroz kuting va qayta urinib ko‘ring 😊"
			);
		}
	}
}
