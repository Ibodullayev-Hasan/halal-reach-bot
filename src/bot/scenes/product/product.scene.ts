import { IMyContext } from "@bot/my-context";
import { Markup, Scenes } from "telegraf";
import { keepSceneAlive } from "@bot/utils";
import { productData } from "./product.data";
import { createProduct, updateProdcut, findByIdProdcut, deleteProdcut } from "modules/products";
import { categoryList, findByIdCategory } from "modules/categories/category.service";
import { buildProductMessage } from "./utils";
import { Product } from "db/entities/product.entity";


/* ====================== Product SCENE ====================== */
export const productScene = new Scenes.BaseScene<IMyContext>(`productScene`);

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

			ctx.session.fromFlag = { fromAddProduct: true };

			await Promise.all([
				ctx.reply("Yangi mahsulot uchun hech qanday kategoriya topilmadi. Avval kategoriya qo'shing.", inlineNavigation),
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
			const price = ctx.message.text;

			const priceStr = String(price).trim(); // Agar price allaqachon string bo'lmasa, stringga aylantiring

			if (priceStr.length > 9 || isNaN(Number(priceStr))) {
				await ctx.reply("Narx son bo'lishi kerak va 10 xonadan oshmasin. Qaytadan kiriting.");
				return; // Stay
			}

			// Agar kasr qismi (decimal) bo'lsa, nuqtani hisobga oling, masalan:
			const parts = priceStr.split('.');
			if (parts.length > 2 || // Ko'p nuqta bo'lmasin
				parts[0].length > 8 || // Butun qism 8 xonadan oshmasin (DECIMAL(10,2) uchun)
				(parts[1] && parts[1].length > 2)) { // Kasr qism 2 xonadan oshmasin
				await ctx.reply("Narx formati noto'g'ri (max 8 xona oldin, 2 keyin). Qaytadan kiriting.");
				return;
			}

			// Keyin haqiqiy price ni number ga aylantiring
			const finalPrice = Number(priceStr);

			ctx.session.price = finalPrice

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
							Markup.button.callback("Mahsulotlar bo'limiga qaytish", `return_to_product_menu`)
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


// add product 
productScene.hears(`🆕  Qo'shish`, async (ctx: IMyContext) => {
	await ctx.scene.enter(`addProductWizard`)
})


// get products list
productScene.hears(`📋  Mahsulotlar listi`, async (ctx) => ctx.scene.enter(`productListWizard`));

export const productListWizard = new Scenes.WizardScene<IMyContext>(`productListWizard`,

	// Step 1: Show categories with products
	async (ctx: IMyContext) => {
		const categories = await categoryList(ctx);

		const addProductInlineKeyboard = Markup.inlineKeyboard([
			[
				Markup.button.callback("Add 🆕", `add_product`),
				Markup.button.callback("Return menu 🔙", `return_to_product_menu`),
			]
		]);

		if (categories.length === 0) {

			await ctx.reply("Hozircha hech qanday mahsulot qoshmagansiz.😇", Markup.removeKeyboard());

			await ctx.reply(`Yangi mahsulot qo'shish uchun 'Add 🆕' ni\n\nyoki menyuga qaytish uchun 'Return menu 🔙' ni bosing.`, addProductInlineKeyboard)

			return await ctx.scene.leave();
		};

		await ctx.reply("Qaysi kategoriyadagi mahsulotni kormoqchisiz?", Markup.inlineKeyboard(
			categories.map(cat => Markup.button.callback(cat.name, `view_cat_${cat.id}`)),
			{ columns: 3 }
		));
		return ctx.wizard.next();
	},

	// Step 2: Handle category selection and show products
	async (ctx: IMyContext) => {
		try {
			if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
				await ctx.reply("Iltimos, kategoriyani tanlang.");
				return;
			}

			const chatId = ctx.chat!.id;
			const categoryId = ctx.callbackQuery.data.split("_")[2];

			await ctx.answerCbQuery();

			const category = await findByIdCategory(ctx, categoryId);

			if (!category || !category.products.length) {
				await ctx.telegram.sendMessage(
					chatId,
					"Ushbu kategoriyada mahsulot yo‘q."
				);

				return;
			}

			await ctx.deleteMessage();

			await ctx.telegram.sendMessage(
				chatId,
				`<code>${category.name}</code> kategoriyasidagi mahsulotlar`,
				{ parse_mode: "HTML" }
			);

			for (const product of category.products) {
				const messageText = buildProductMessage(product, category);

				if (product.productImg) {
					await ctx.telegram.sendPhoto(
						chatId,
						product.productImg,
						{
							caption: messageText,
							parse_mode: "MarkdownV2"
						}
					);
				} else {
					await ctx.telegram.sendMessage(
						chatId,
						messageText,
						{ parse_mode: "MarkdownV2" }
					);
				}
			};

			const productInlineKeyboards = Markup.inlineKeyboard([
				[
					Markup.button.callback("Yana ko‘rish", "show_categories_again"),
					Markup.button.callback("Mahsulotlar bo‘limiga qaytish", "return_to_product_menu")
				]
			]);

			await Promise.all([
				ctx.telegram.sendMessage(
					chatId,
					`...`,
					{ reply_markup: { remove_keyboard: true } }
				),

				ctx.telegram.sendMessage(
					chatId,
					"Mahsulotlar ro'yxati tugadi. Yana ko‘rishni xohlaysizmi?",
					{
						reply_markup: {
							...productInlineKeyboards.reply_markup,
							remove_keyboard: true
						}
					}
				)
			]);
			////////////// -------------- ////////////////

			// 🔴 WIZARDNI YOPISH
			return ctx.scene.leave();

		} catch (err) {
			console.error(err);
			await ctx.reply("Xatolik yuz berdi. Keyinroq urinib ko‘ring.");
			return ctx.scene.leave();
		}
	}
);


// edit product data
productScene.hears(`✏️  Tahrirlash`, async (ctx: IMyContext) => {
	await ctx.scene.enter(`updateProductWizard`)
});

// edit product data wizard
export const updateProductWizard = new Scenes.WizardScene<IMyContext>(`updateProductWizard`,

	// STEP:1
	async (ctx: IMyContext) => {
		const categories = await categoryList(ctx);
		const chatId = ctx.chat!.id

		const categoryButtons = categories.map((cat, index) =>
			Markup.button.callback(
				`${index + 1}. ${cat.name}`,
				`cat_${cat.id}`
			)
		)

		await ctx.telegram.sendMessage(chatId, `Qaysi kategoriyadagi mahsulotni tahrirlamoqchisiz, kategoryni tanlang`, Markup.inlineKeyboard(categoryButtons, { columns: 2 }));

		return ctx.wizard.next()
	},

	// STEP:2
	async (ctx: IMyContext) => {

		if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
			await ctx.reply("Iltimos, kategoriyani tanlang.");
			return;
		}

		const chatId = ctx.chat!.id;
		const categoryId = ctx.callbackQuery.data.split("_")[1];

		await ctx.answerCbQuery();

		const category = await findByIdCategory(ctx, categoryId);

		for (const product of category.products) {
			const messageText = `ID: <code>${product.id}</code>\n name: ${product.name}`

			if (product.productImg) {
				await ctx.telegram.sendPhoto(
					chatId,
					product.productImg,
					{
						caption: messageText,
						parse_mode: "HTML"
					}
				);
			} else {
				await ctx.telegram.sendMessage(
					chatId,
					messageText,
					{ parse_mode: "MarkdownV2" }
				);
			};
		};

		await ctx.telegram.sendMessage(
			chatId,
			`Tahrirlamoqchi bo‘lgan mahsulot ID sini kiriting...`
		);

		return ctx.wizard.next()
	},

	// STEP:3 - ID kiritish + buttonlar yuborish (oldingi STEP:4 kodini shu yerga ko'chiring)
	async (ctx: IMyContext) => {
		const chatId = ctx.chat!.id;

		if (!ctx.message || !('text' in ctx.message)) {
			await ctx.reply("Iltimos, faqat matn ko‘rinishida ID yuboring.");
			return;
		}

		ctx.session.productId = ctx.message.text.trim();

		const product = await findByIdProdcut(ctx, ctx.session.productId);

		if (!product) {
			await ctx.reply(`Mahsulot topilmadi\n Qayta urinib ko'ring`);
			return ctx.scene.leave();
		};

		// Tahrirlanadigan fieldlar
		const editableFields = [
			{ key: "name", label: "📛 Nomi" },
			{ key: "price", label: "💰 Narxi" },
			{ key: "description", label: "📝 Tavsifi" },
			{ key: "productImg", label: "🖼 Rasm" },
		];

		const buttons = editableFields.map(field => [
			Markup.button.callback(
				field.label,
				`edit_product_${field.key}`
			)
		]);

		await ctx.telegram.sendMessage(
			chatId,
			"Nimani tahrirlamoqchisiz? 👇",
			{
				reply_markup: {
					inline_keyboard: buttons
				}
			}
		);

		return ctx.wizard.next();  // Endi bu STEP:4 (oldingi STEP:5) ga o'tkazadi
	},

	// STEP:4 (oldingi STEP:5) - field tanlash
	async (ctx: IMyContext) => {
		if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

		const field = ctx.callbackQuery.data.split("_")[2];

		ctx.session.editingField = field as keyof Product;

		await ctx.answerCbQuery();
		await ctx.reply(`Yangi ${field} qiymatini kiriting:`);

		return ctx.wizard.next();
	},

	// STEP:5 (oldingi STEP:6) - tahrirlashga yuborish
	async (ctx: IMyContext) => {

		if (!ctx.message || !('text' in ctx.message)) {
			await ctx.reply("Iltimos, faqat matn ko‘rinishida ID yuboring.");
			return;
		};

		const id = ctx.session?.productId;
		const text = ctx.message?.text;
		const field = ctx.session.editingField

		const updatingData = { [field]: text }

		const result = await updateProdcut(ctx, id, updatingData);

		if (result) {
			await ctx.reply(`Yangilandi ✅ `)
			return ctx.scene.enter(`productScene`);
		};

		await ctx.reply(`Bajarilmadi, qaytadan urinib koring`)
		return ctx.scene.leave();

	}

);


// delete product
productScene.hears(`⭕  O'chirish`, async (ctx) => { await ctx.scene.enter(`deleteProductWizard`) });

export const deleteProductWizard = new Scenes.WizardScene<IMyContext>(`deleteProductWizard`,

	// STEP:1
	async (ctx: IMyContext) => {
		const categories = await categoryList(ctx);
		const chatId = ctx.chat!.id

		const categoryButtons = categories.map((cat, index) =>
			Markup.button.callback(
				`${index + 1}. ${cat.name}`,
				`cat_${cat.id}`
			)
		)

		await ctx.telegram.sendMessage(chatId, `Qaysi kategoriyadagi mahsulotni o'chirmoqchisiz, kategoryni tanlang`, Markup.inlineKeyboard(categoryButtons, { columns: 2 }));

		return ctx.wizard.next()
	},

	// STEP:2
	async (ctx: IMyContext) => {

		if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
			await ctx.reply("Iltimos, kategoriyani tanlang.");
			return;
		};

		const chatId = ctx.chat!.id;
		const categoryId = ctx.callbackQuery.data.split("_")[1];

		await ctx.answerCbQuery();

		const category = await findByIdCategory(ctx, categoryId);

		for (const product of category.products) {
			const messageText = `ID: <code>${product.id}</code>\n name: ${product.name}`

			if (product.productImg) {
				await ctx.telegram.sendPhoto(
					chatId,
					product.productImg,
					{
						caption: messageText,
						parse_mode: "HTML"
					}
				);
			} else {
				await ctx.telegram.sendMessage(
					chatId,
					messageText,
					{ parse_mode: "HTML" }
				);
			};
		};

		await ctx.telegram.sendMessage(
			chatId,
			`O'chirmoqchi bo‘lgan mahsulot ID sini kiriting...`
		);

		return ctx.wizard.next()
	},

	// STEP:3 - ID kiritish + buttonlar yuborish (oldingi STEP:4 kodini shu yerga ko'chiring)
	async (ctx: IMyContext) => {
		const chatId = ctx.chat!.id;

		if (!ctx.message || !('text' in ctx.message)) {
			await ctx.reply("Iltimos, faqat matn ko‘rinishida ID yuboring.");
			return;
		};

		const result = await deleteProdcut(ctx, ctx.message.text.trim());


		if (result) {
			await ctx.reply(`O'chirildi ✅ `)
			return ctx.scene.enter(`productScene`);
		};

		await ctx.reply(`Bajarilmadi, qaytadan urinib koring`)
		return ctx.scene.leave();
	}

);


/////////////////////
productListWizard.hears(`Back`, async (ctx) => {
	ctx.scene.enter(`productScene`);
});

updateProductWizard.hears(`Back`, async (ctx) => {
	ctx.scene.enter(`productScene`);
});
/* ====================== Product SCENE END ====================== */
