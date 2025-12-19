import { IMyContext } from "@bot/my-context";
import { categoryRepo, productRepo } from "db/repositories";
import { Markup, Scenes } from "telegraf";

const keepSceneAlive = async (ctx: any, next: () => Promise<void>) => {
	ctx.scene?.resetLeaveTimer?.();
	return next();
};

export const adminScene = new Scenes.BaseScene<IMyContext>("admin");

adminScene.use(keepSceneAlive);

// admin keyboards and greetings
adminScene.enter(async (ctx: IMyContext) => {

	const adminKeyboards = Markup.keyboard([
		[`🛒 Mahsulotlar`, `📦 Buyurtmalar`],
		[`🗃️ Turkumlar`, `📊  Statistika`],
		[`🛑  Chiqish`],
	]).resize();

	if (ctx.session.adminBackFlag) {
		await ctx.reply("Menyuga qaytildi", adminKeyboards);
		ctx.session.adminBackFlag = false;
		return;
	};

	await ctx.reply(`Assalomu aleykum Admin 👋`, adminKeyboards);
});

adminScene.hears(`🛒 Mahsulotlar`, (ctx) => ctx.scene.enter(`productScene`));
adminScene.hears(`🗃️ Turkumlar`, (ctx) => ctx.scene.enter(`categoryScene`));
adminScene.hears(`📦 Buyurtmalar`, (ctx) => ctx.scene.enter(`orderScene`));
adminScene.hears(`📊  Statistika`, (ctx) => ctx.scene.enter(`statisticsScene`));
adminScene.hears(`🛑  Chiqish`, async (ctx) => {
	await Promise.all([
		ctx.scene.leave(),
		ctx.reply("Admin paneldan chiqdingiz", Markup.removeKeyboard())
	]);
});


/* ====================== Product SCENE ====================== */
export const productScene = new Scenes.BaseScene<IMyContext>(`productScene`);

// add product wizard
export const addProductWizard = new Scenes.WizardScene<IMyContext>(`addProductWizard`,

	// STEPS:
	// Step 1: Select category
	async (ctx: IMyContext) => {
		const categories = await categoryRepo.find();

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
					const fileLink = await ctx.telegram.getFileLink(photo.file_id);
					productImg = fileLink.href ? fileLink.href : fileLink.toString();  // Telegramdan yuklangan rasm URLsi
				} else if ("text" in ctx.message) {
					const input = ctx.message.text;
					if (input === "skip") {
						// Skip qilish
					} else if (/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(input)) {  // Oddiy URL validatsiyasi (jpg, png va h.k. bilan tugashi)
						productImg = input;  // Tashqi URLni to'g'ridan saqlash
					} else {
						await ctx.reply("Iltimos, rasm yuklang, valid URL kiriting yoki 'skip' deb yozing.");
						return;  // Stay
					}
				} else {
					await ctx.reply("Iltimos, rasm yuklang yoki 'skip' deb yozing.");
					return;  // Stay
				}
			}

			ctx.session.productImg = productImg;

			const category = await categoryRepo.findOneBy({ id: ctx.session.categoryId! });

			if (!category) {
				await ctx.reply("Tanlangan kategoriya topilmadi. Iltimos, qaytadan urinib ko'ring.");
				return ctx.scene.leave();
			};

			const newProduct = productRepo.create({
				name: ctx.session.name!,
				price: ctx.session.price!,
				description: ctx.session.description,
				productImg: ctx.session.productImg,
				category: category
			});

			await productRepo.save(newProduct).then(async () => {

				await Promise.all([

					ctx.reply(`✅ Mahsulot muvaffaqiyatli qo'shildi:\n\nNomi: ${newProduct.name}\nNarxi: ${newProduct.price} so'm${newProduct.description ? `\nTavsifi: ${newProduct.description}` : ""}`,
						Markup.inlineKeyboard([
							Markup.button.callback("Yana mahsulot qo'shish", `add_product`),
							Markup.button.callback("Mahsulotlar bo'limiga o'tish", `productScene`)
						])
					),
					ctx.scene.leave()
				])
			});

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
		[`📋  Mahsulotlar`, `⭕  O'chirish`],
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
productScene.hears(`📋  Mahsulotlar`, async (ctx: IMyContext) => {
	const products = await productRepo.find({ relations: { category: true } });

	if (products.length === 0) {
		await ctx.reply("Hech qanday mahsulot topilmadi.");
		return;
	};

	for (const product of products) {
		const categoryName = product.category ? product.category.name : "null";
		const categoryImg = product.category ? (product.category.categoryImg || "null") : "null";
		const productImg = product.productImg || null; // null bo'lsa, oddiy text yuboramiz
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
			// Agar rasm bo'lsa, replyWithPhoto bilan yuborish
			await ctx.replyWithPhoto(productImg, {
				caption: messageText,
				parse_mode: 'MarkdownV2' // MarkdownV2 ishlatish uchun (bold va h.k.)
			});
		} else {
			// Rasm bo'lmasa, oddiy text
			await ctx.reply(messageText, { parse_mode: 'MarkdownV2' });
		}
	}
});


/* ====================== Order SCENE ====================== */
export const orderScene = new Scenes.BaseScene<IMyContext>(`orderScene`);

orderScene.use(keepSceneAlive);

orderScene.enter(async (ctx) => {
	const orderMenuKeyboard = Markup.keyboard([
		[`Back`]
	]).resize();

	await ctx.reply(`Buyurtmalar bo'limi`, orderMenuKeyboard);
});

orderScene.hears(`Back`, async (ctx) => {
	ctx.session.adminBackFlag = true
	ctx.scene.enter('admin')
});


/* ====================== statistics SCENE ====================== */
export const statisticsScene = new Scenes.BaseScene<IMyContext>(`statisticsScene`);

statisticsScene.use(keepSceneAlive);

statisticsScene.enter(async (ctx) => {
	const statisticsMenuKeyboard = Markup.keyboard([
		[`Back`]
	]).resize();

	await ctx.reply(`Statistika:`, statisticsMenuKeyboard);
});

statisticsScene.hears(`Back`, async (ctx) => {
	ctx.session.adminBackFlag = true
	ctx.scene.enter('admin')
});