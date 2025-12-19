import { UserRoles } from "enums/roles.enum";
import { Context } from "telegraf";

export const UserFromCtx = (ctx: Context, role?: UserRoles) => {
	const user = ctx.from;
	if (!user) return null;

	return {
		telegramId: user.id,
		userName: user.username,
		firstName: user.first_name,
		lastName: user.last_name,
		phoneNumber: (ctx.message as any)?.contact?.phone_number || null,
		userRole: role
	};
};
