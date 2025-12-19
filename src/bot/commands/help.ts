import { environments } from "@config/environments";
import { UserRoles } from "enums/roles.enum";
import { checkRole } from "middlewares/role.middleware";
import { Context } from "telegraf";
import { userData } from "modules/user";

export const BotHelp = async (ctx: Context): Promise<void> => {
	try {
		
		const user = await userData(ctx)

		const helpTextAdmin = (environments.BOT_HELP_TEXT_ADMIN || '')
			.replace(/\\n/g, '\n');
		const helpTextClient = (environments.BOT_HELP_TEXT_CLIENT || '')
			.replace(/\\n/g, '\n'); // \n ni haqiqiy newline ga o‘zgartiramiz

		const greeting = `🤖 <b>Botdan foydalanish bo‘yicha qo‘llanma</b>
_____________________________________________
Assalomu alaykum xurmatli ${user?.userRole === "client" ? "mijoz" : user?.userRole}!
`;

		if (checkRole(user.userRole, [UserRoles.CLIENT])) {
			await ctx.replyWithHTML(greeting + helpTextClient);
		}

		if (checkRole(user.userRole, [UserRoles.ADMIN])) {
			await ctx.replyWithHTML(greeting + helpTextAdmin);
		}

	} catch (error) {
		console.error("❌ UserProfile error:", error);
		await ctx.reply("Nimadir xato ketdi 🥶\nBiroz kuting va qayta urinib ko‘ring 😊");
	}
}