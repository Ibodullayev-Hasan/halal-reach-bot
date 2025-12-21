import { IMyContext } from "@bot/my-context";
import { Markup, Scenes } from "telegraf";
import { keepSceneAlive } from "@bot/utils";
import { productData } from "./product.data";
import { createProduct, prodcutList } from "modules/products";
import { categoryList, findByIdCategory } from "modules/categories/category.service";


/* ====================== Product SCENE ====================== */
export const productScene = new Scenes.BaseScene<IMyContext>(`productScene`);

// add product wizard
export const addProductWizard = new Scenes.WizardScene<IMyContext>(`addProductWizard`,

	// STEPS:
	// Step 1: Select category
	async (ctx: IMyContext) => {
		const categories = await categoryList(ctx);

		if (categories.length === 0) {

			const inlineNavigation = Markup.inlineKeyboard([
				Markup.button.callback("Kategoriya qo'shish", `add_category`)
			]);

			await Promise.all([
				ctx.reply("Hech qanday kategoriya topilmadi. Avval kategoriya qo'shing.", inlineNavigation),
				ctx.scene.leave()
			]);
			return;
		};

		const categoryButtons = categories.map((cat) => Markup.button.callback(cat.name, `cat_${cat.id}`));

		await ctx.reply(`Mahsulot uchun categoryni tanlang`, Markup.inlineKeyboard(categoryButtons, { columns: 3 }));
		return ctx.wizard.next();
	},

	// Step 1: Handle category selection and ask for name
	async (ctx: IMyContext) => {
		if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
			const categoryId = ctx.callbackQuery.data.split("_")[1];

			ctx.session.categoryId = categoryId;

			await ctx.reply("Mahsulot nomini kiriting:");

			return ctx.wizard.next();
		} else {
			await ctx.reply("Iltimos, kategoriyani tanlang.");
			return; // Stay in this step
		}
	},

	// Step 2: Ask for price after name
	async (ctx: IMyContext) => {
		if (ctx.message && "text" in ctx.message) {

			ctx.session.name = ctx.message.text; // Store name
			await ctx.reply("Mahsulot narxini kiriting (son bilan):");
			return ctx.wizard.next();
		} else {
			await ctx.reply("Iltimos, matn kiriting.");
			return; // Stay
		}
	},

	// Step 3: Ask for description after price
	async (ctx: IMyContext) => {

		if (ctx.message && "text" in ctx.message) {
			const price = parseInt(ctx.message.text);
			if (isNaN(price)) {
				await ctx.reply("Narx son bo'lishi kerak. Qaytadan kiriting.");
				return; // Stay
			}
			ctx.session.price = price; // Store price

			await ctx.reply("Mahsulot tavsifini kiriting (yoki 'skip' deb yozing):");
			return ctx.wizard.next();
		} else {
			await ctx.reply("Iltimos, son kiriting.");
			return; // Stay
		}
	},

	// Step 4: Ask for image after description
	async (ctx) => {
		if (ctx.message && "text" in ctx.message) {
			const description = ctx.message.text;
			ctx.session.description = description !== "skip" ? description : undefined; // Optional

			await ctx.reply("Mahsulot rasmini yuklang (yoki 'skip' deb yozing):");
			return ctx.wizard.next();
		} else {
			await ctx.reply("Iltimos, matn kiriting.");
			return; // Stay
		}
	},

	// Step 5: Save product
	async (ctx: IMyContext) => {

		try {
			let productImg: string | undefined;

			if (ctx.message) {
				if ("photo" in ctx.message) {

					const photo = ctx.message.photo[ctx.message.photo.length - 1];
					productImg = photo.file_id

				} else if ("text" in ctx.message) {

					const input = ctx.message.text;

					if (input === "skip") {
						productImg = undefined;
					}
					else if (/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(input)) {
						productImg = input; // ✅ faqat PUBLIC image URL
					}
					else {
						await ctx.reply("Iltimos, rasm yuklang, valid URL kiriting yoki 'skip' deb yozing.");
						return;
					}
				} else {
					await ctx.reply("Iltimos, rasm yuklang yoki 'skip' deb yozing.");
					return;  // Stay
				}
			};

			ctx.session.productImg = productImg;

			const category = await findByIdCategory(ctx, ctx.session.categoryId!);

			if (!category) {
				await ctx.reply("Tanlangan kategoriya topilmadi. Iltimos, qaytadan urinib ko'ring.");
				return ctx.scene.leave();
			};

			const newProduct = await createProduct(ctx, productData(ctx, category));

			if (newProduct) {
				await Promise.all([

					ctx.reply(`✅ Mahsulot muvaffaqiyatli qo'shildi:\n\nNomi: ${newProduct.name}\nNarxi: ${newProduct.price} so'm${newProduct.description ? `\nTavsifi: ${newProduct.description}` : ""}`,
						Markup.inlineKeyboard([
							Markup.button.callback("Mahsulotlar bo'limiga qaytish", `return_to_add_product`)
						])
					),
					ctx.scene.leave()
				])
			}

		} catch (error) {
			console.error("Mahsulot qo'shishda xatolik:", error);
			await ctx.reply("Mahsulot qo'shishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring. /admin orqali bosh menyuga qayting.");
			return ctx.scene.leave();
		}
	},
);

productScene.use(keepSceneAlive);


// product menu buttons
productScene.enter(async (ctx) => {
	const productMenuKeyboard = Markup.keyboard([
		[`🆕  Qo'shish`, `✏️  Tahrirlash`],
		[`📋  Mahsulotlar listi`, `⭕  O'chirish`],
		[`Back`]
	]).resize();

	await ctx.reply(`Mahsulotlar bo'limi`, productMenuKeyboard);
});

productScene.hears(`Back`, async (ctx) => {
	ctx.session.adminBackFlag = true
	ctx.scene.enter('admin')
});


// add product 
productScene.hears(`🆕  Qo'shish`, async (ctx: IMyContext) => {
	await ctx.scene.enter(`addProductWizard`)
})

// MarkdownV2 uchun escape funksiyasi
function escapeMarkdownV2(text: string): string {
	return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

// get products list
productScene.hears(`📋  Mahsulotlar listi`, async (ctx) => ctx.scene.enter(`productListWizard`));

export const productListWizard = new Scenes.WizardScene<IMyContext>(`productListWizard`,

	// Step 1: Show categories with products
	async (ctx: IMyContext) => {
		const categories = await categoryList(ctx);

		if (categories.length === 0) {
			await ctx.reply("Hozircha hech qanday mahsulot qoshmagansiz.😇");
			return ctx.scene.leave();
		};

		await ctx.reply("Qaysi kategoriyadagi mahsulotni kormoqchisiz?", Markup.inlineKeyboard(
			categories.map(cat => Markup.button.callback(cat.name, `view_cat_${cat.id}`)),
			{ columns: 3 }
		));
		return ctx.wizard.next();
	},

	// Step 2: Handle category selection and show products
	async (ctx: IMyContext) => {
		if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
			const categoryId = ctx.callbackQuery.data.split("_")[2];

			const category = await findByIdCategory(ctx, categoryId);

			if (!category || category.products.length === 0) {
				await ctx.reply("Ushbu kategoriyada hech qanday mahsulot topilmadi.");
				return
			};

			for (const product of category.products) {
				
				const categoryName = category.name;
				const categoryImg = category.categoryImg || "null";
				const productImg = product.productImg || null;
				const description = product.description || "null";

				// Escape qilinadigan qismlar
				const escapedName = escapeMarkdownV2(product.name);
				const escapedPrice = escapeMarkdownV2(product.price.toString());
				const escapedDescription = escapeMarkdownV2(description);
				const escapedCategoryName = escapeMarkdownV2(categoryName);
				const escapedCategoryImg = escapeMarkdownV2(categoryImg);

				let messageText = `🔹 **Nomi:** ${escapedName}\n`;
				messageText += `💰 **Narxi:** ${escapedPrice} so'm\n`;
				messageText += `📝 **Tavsifi:** ${escapedDescription}\n`;
				messageText += `📂 **Kategoriyasi:** ${escapedCategoryName}\n`;
				messageText += `🖼️ **Kategoriya rasmi:** ${escapedCategoryImg}\n\n`;

				if (productImg) {

					await ctx.replyWithPhoto(productImg, {
						caption: messageText,
						parse_mode: 'MarkdownV2'
					});
				} else {
					await ctx.reply(messageText, { parse_mode: 'MarkdownV2' });
				}
			}
		} else {
			await ctx.reply("Iltimos, kategoriyani tanlang.");
			return; // Stay in this step	
		};

	}
);

productListWizard.hears(`Back`, async (ctx) => {
	ctx.scene.enter(`productScene`);
});
/* ====================== Product SCENE END ====================== */
