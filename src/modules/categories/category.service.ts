import { IMyContext } from "@bot/my-context"
import { Category } from "db/entities/category.entity"
import { categoryRepo } from "db/repositories";

export const createCategory = async () => {

}

export const findByIdCategory = async (ctx: IMyContext, id: string): Promise<Category | null> => {
	try {
		const category = await categoryRepo.findOne({ where: { id }, relations: ['products'] });

		if(!category) return null;
		
		return category
	} catch (error: any) {
		console.error(error.message);
		await ctx.reply('Nimadir xato ketdi qaytsa urinib koring!🙏');
	}
};

export const categoryList = async (ctx: IMyContext): Promise<Category[]> => {
	try {
		const categories = await categoryRepo.find({ relations: { products: true } });
		return categories;
	} catch (error: any) {
		console.error(error.message);
		await ctx.reply('Nimadir xato ketdi qaytsa urinib koring!🙏');
	};
};

export const deleteCategoryByID = async (
	ctx: IMyContext,
	id: string
): Promise<boolean> => {
	try {
		const category = await categoryRepo.findOne({ where: { id } });

		if (!category) return false;

		const result = await categoryRepo.delete(id);

		return (result.affected ?? 0) > 0;

	} catch (error: any) {
		console.error(error.message);
		await ctx.reply("Nimadir xato ketdi, qayta urinib ko‘ring 🙏");
		return false;
	}
};
