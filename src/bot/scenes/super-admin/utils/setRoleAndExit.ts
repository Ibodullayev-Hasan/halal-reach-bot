import { SuperAdminEvent } from "@bot/events/super.admin.events";
import { IMyContext } from "@bot/my-context";
import { UserRoles } from "enums/roles.enum";


/* ====================== YORDAMCHI FUNKSIYA ====================== */
const event = new SuperAdminEvent();

export async function setRoleAndExit(ctx: IMyContext, role: UserRoles) {
	try {
		if (ctx.session.roleMessageId) {
			await ctx.deleteMessage(ctx.session.roleMessageId).catch(() => { });
			ctx.session.roleMessageId = null;
		}

		const success = await event.changeRole(role, ctx);

		if (!success) {
			await ctx.answerCbQuery("Xatolik yuz berdi", { show_alert: true });
			return;
		}

		const commands = {
			[UserRoles.SUPER_ADMIN]: [
				{ command: "super_admin", description: "Super Admin panel" },
				{ command: "profile", description: "Profil" }
			],
			[UserRoles.ADMIN]: [
				{ command: "profile", description: "Profil" },
				{ command: "admin", description: "Admin panel" },
				{ command: "super_admin", description: "Super Admin panel" },
			],
			[UserRoles.CLIENT]: [
				{ command: "profile", description: "Profil" },
				{ command: "client", description: "Mijoz menyusi" },
				{ command: "super_admin", description: "Super Admin panel" },
			],
			[UserRoles.COURIER]: [
				{ command: "profile", description: "Profil" },
				{ command: "courier", description: "Yetkazib berish" },
				{ command: "super_admin", description: "Super Admin panel" },
			],
		};

		await Promise.all([
			ctx.telegram.setMyCommands(commands[role] || [], {
				scope: { type: "chat", chat_id: ctx.chat!.id },
			}),
			ctx.reply(`Rolingiz <code>${role}</code> ga o‘zgartirildi!`, { parse_mode: "HTML" }),
			ctx.answerCbQuery(),
		]);

		ctx.session.superAdminBackFlag = true;
	} catch (err) {
		console.error(err);
		await ctx.answerCbQuery("Xatolik yuz berdi", { show_alert: true });
	}
}