import { IMyContext } from "@bot/my-context";
import { Product } from "db/entities/product.entity";
import { productRepo } from "db/repositories";

export const createProduct = async (ctx: IMyContext, data: Omit<Product, 'id'>): Promise<Product> => {
	try {

		const newProduct = productRepo.create(data);

		return await productRepo.save(newProduct);
	} catch (error: any) {
		console.error(error.message);
		await ctx.reply('Nimadir xato ketdi qaytsa urinib koring!🙏');
	}

};

export const prodcutList = async (ctx: IMyContext): Promise<Product[]> => {
	try {
		const products = await productRepo.find({ relations: { category: true } });
		
		return products;
	} catch (error: any) {
		console.error(error.message);
		await ctx.reply('Nimadir xato ketdi qaytsa urinib koring!🙏');
	};
}