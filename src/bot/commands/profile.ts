import { userData } from "modules/user";
import { IMyContext } from "@bot/my-context";

export const UserProfile = async (ctx: IMyContext): Promise<void> => {
	try {
		
		const user = await userData(ctx)

		if (!user) {
			await ctx.reply("❌ Siz ro'yxatdan o'tmagansiz!");
			return;
		}

		const date = user.createdAt ? new Date(user.createdAt) : null;

		const formattedDate = date
			? date.toLocaleString("uz-UZ", {
				day: "numeric",
				month: "long",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
			: "-";

		const message = `
				<b>📇 Foydalanuvchi profili</b>
				━━━━━━━━━━━━━━━
				👤 <code>Ism: </code> ${user.firstName || ""} ${user.lastName || ""} \n
				🪪 <code>Username: </code> @${user.userName || "-"}\n
				📞 <code>Tel: </code> ${user.phoneNumber || "-"}\n
				👔 <code>Role: </code> ${user.userRole || "-"}\n
				📅 <code>Ro'yxatdan o'tgan: </code> <u>${formattedDate}</u>
				`;

		await ctx.replyWithHTML(message.trim(), {
			reply_markup: { remove_keyboard: true }
		});

	} catch (error) {
		console.error("❌ UserProfile error:", error);
		await ctx.reply("Nimadir xato ketdi 🥶\nBiroz kuting va qayta urinib ko‘ring 😊");
	}
};
