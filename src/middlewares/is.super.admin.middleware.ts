import { UserRoles } from "enums/roles.enum";
import { checkRole } from './role.middleware';
import { IMyContext } from '@bot/my-context';
import { userRepo } from "db/repositories";

export const isSuperAdmin = async (ctx: IMyContext & { user?: { userRole: UserRoles } }, next: () => Promise<void>) => {

	const finduser = await userRepo.findOne({ where: { telegramId: ctx.from.id } });

	if (!finduser) { return await ctx.reply("❌ Error: Please register first by clicking /start") };

	(ctx as any).user = finduser

	if (checkRole(ctx.user?.userRole, [UserRoles.SUPER_ADMIN]) || finduser.temporaryRoleReversal === true) {
		return next();
	} else {
		await ctx.reply('Sizga super admin huquqi berilmagan!');
	}
};