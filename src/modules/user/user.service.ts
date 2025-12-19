import { IMyContext } from "@bot/my-context";
import { User } from "db/entities/user.entity";
import { userRepo } from "db/repositories";
import { UserRoles } from "enums/roles.enum";
import { Context } from "telegraf";

export const userData = async (ctx: Context): Promise<User | null> => {
	return await userRepo.findOne({ where: { telegramId: ctx.from?.id } })
}

export const userCreate = async (data: Omit<User, "id">): Promise<User | null> => {
	try {

		const existingUser = await userRepo.findOne({ where: { telegramId: data.telegramId } })

		if (existingUser) return null

		const newUserCreate = await userRepo.save(data)

		return newUserCreate
	} catch (error: any) {
		console.error(error.message)
	}
}

export const userUpdate = async (user: User, ctx?: IMyContext,): Promise<boolean> => {
	try {
		if (!user) return false

		user.userRole = UserRoles.ADMIN

		await userRepo.save(user)
		return true

	} catch (error: any) {
		console.error(error.message)
		await ctx.reply('Nimadir xato ketdi qaytsa urinib koring!🙏')
	}
};