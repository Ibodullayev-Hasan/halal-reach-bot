import { IMyContext } from "@bot/my-context";
import { Product } from "db/entities/product.entity";
import { productRepo } from "db/repositories";

export const createProduct = async (ctx: IMyContext, data: Omit<Product, 'id'>): Promise<Product> => {
	try {

		const newProduct = productRepo.create(data);

		return await productRepo.save(newProduct);
	} catch (error: any) {
		console.error(error.message);
		await ctx.reply(`${error.message}; \n\n /admin orqali qayta urinib koring!🙏`);
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
};

export const updateProdcut = async (ctx: IMyContext, id: string, data: Partial<Product>): Promise<boolean> => {
	try {
		const product = await productRepo.findOne({ where: { id } });

		if (!product) return null

		const result = await productRepo.update(id, data);

		return (result.affected ?? 0) > 0;
	} catch (error: any) {
		console.error(error.message);
		await ctx.reply('Nimadir xato ketdi qaytsa urinib koring!🙏');
	};
};

export const deleteProdcut = async (ctx: IMyContext, id: string): Promise<boolean> => {
	try {
		const product = await productRepo.findOne({ where: { id } });

		if (!product) return null

		const result = await productRepo.delete(id);

		return (result.affected ?? 0) > 0;
	} catch (error: any) {
		console.error(error.message);
		await ctx.reply('Nimadir xato ketdi qaytsa urinib koring!🙏');
	};
};

export const findByIdProdcut = async (ctx: IMyContext, id: string): Promise<Product | null> => {
	try {
		const product = await productRepo.findOne({ where: { id } });

		if (!product) return null

		return product;
	} catch (error: any) {
		console.error(error.message);
		await ctx.reply('Nimadir xato ketdi qaytsa urinib koring!🙏');
	};
};
