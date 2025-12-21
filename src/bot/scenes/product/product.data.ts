import { IMyContext } from "@bot/my-context";
import { Category } from "db/entities/category.entity";

export const productData = (ctx: IMyContext, category: Category) => {
	return {
		name: ctx.session.name!,
		price: ctx.session.price!,
		description: ctx.session.description,
		productImg: ctx.session.productImg,
		category: category
	}
}