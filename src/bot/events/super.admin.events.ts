import { IMyContext } from "@bot/my-context";
import { UserFromCtx } from "@bot/user-from-ctx";
import { userRepo } from "db/repositories";
import { UserRoles } from "enums/roles.enum";
import { Context } from "telegraf";
import { userUpdate } from "modules/user";

export class SuperAdminEvent {
	constructor() { }

	// 📊  Statistika
	async statistics(ctx: Context): Promise<void> {
		try {

			const users = await userRepo.find()
			await ctx.replyWithHTML(`
				<b>Bot statistikasi</b>
-----------------------------
<code>Bot users: </code> ${users.length}ta\n
				`);

		} catch (error: any) {
			console.error("❌ super admin, statistika error:", error);
			await ctx.reply("Xatolik yuz berdi. Qayta urinib ko‘ring 🙏");
		}
	}


	// yangi admin
	async newAdmin(ctx: Context, userName: string) {
		try {
			const cleanUserName = userName.replace('@', '').trim();

			const user = await userRepo.findOne({ where: { userName: cleanUserName } })

			if (!user) {
				await ctx.reply(`user topilmadi`)
				return
			}

			const changeUserRole = await userUpdate(user)

			if (changeUserRole) {
				return await ctx.reply(`Yangi admin qo'shildi!\n ${userName} endi admin 🙂!`)
			}

		} catch (error: any) {
			console.error("❌ super admin, new_admin error:", error);
			await ctx.reply("Xatolik yuz berdi. Qayta urinib ko‘ring 🙏");
		}
	};

	async changeRole(role: UserRoles, ctx?: IMyContext,) {
		try {
			const user = await userRepo.findOne({ where: { telegramId: ctx?.from?.id } });
			
			user.userRole = role
			
			await userRepo.save(user);

			return true
		} catch (error: any) {
			console.error("❌ super admin event, changeRole :", error);
			await ctx.reply("Xatolik yuz berdi. Qayta urinib ko‘ring 🙏");
		}
	}
};
