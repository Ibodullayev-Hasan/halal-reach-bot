import { IMyContext } from "@bot/my-context";
import { categoryRepo } from "db/repositories";
import { Markup, Scenes } from "telegraf";
import { keepSceneAlive } from "@bot/utils";
import { categoryList, deleteCategoryByID } from "modules/categories/category.service";

/* ====================== category SCENE ====================== */
export const categoryScene = new Scenes.BaseScene<IMyContext>(`categoryScene`);

categoryScene.use(keepSceneAlive);


// category keyboards and greetings
categoryScene.enter(async (ctx) => {

	const categoryMenuKeyboard = Markup.keyboard([
		[`🆕  Qo'shish`, `✏️  Tahrirlash`],
		[`📋  Kategoriyalar listi`, `⭕  O'chirish`],
		[`Back`]
	]).resize();

	if (ctx.session.adminBackFlag) {
		await ctx.reply("Kategoriyalar bo'limiga qaytildi", categoryMenuKeyboard);
		ctx.session.adminBackFlag = false;
		return;
	};

	await ctx.reply(`Kategoriyalar bo'limi`, categoryMenuKeyboard);

});

categoryScene.hears(`Back`, async (ctx) => {
	ctx.session.adminBackFlag = true
	ctx.scene.enter('admin')
});

// get categories list
categoryScene.hears(`📋  Kategoriyalar listi`, async (ctx: IMyContext) => {
	const categories = await categoryRepo.find();

	if (categories.length === 0) {
		await ctx.reply("Hech qanday kategoriya topilmadi.");
		return;
	};

	const categoryList = categories.map(cat => `• ${cat.name}`).join("\n");

	await ctx.reply(`Kategoriyalar ro'yxati:\n\n${categoryList}`);
});

// add category
categoryScene.hears(`🆕  Qo'shish`, async (ctx: IMyContext) => {
	await ctx.scene.enter(`addCategoryWizard`)
});

// wizards for category management
export const addCategoryWizard = new Scenes.WizardScene<IMyContext>(`addCategoryWizard`,

	// Step 1: Get category name
	async (ctx: IMyContext) => {
		await ctx.reply("Yangi kategoriya nomini kiriting:");
		return ctx.wizard.next();
	},

	async (ctx: IMyContext) => {

		if (!ctx.message || !('text' in ctx.message)) {
			await ctx.reply("Iltimos, to'g'ri nom kiriting:");
			return;
		};

		const returnToAddProduct = Markup.inlineKeyboard([
			Markup.button.callback("Mahsulot qo'shishga qaytish", `return_to_product_menu`)
		]);

		const backCategoryMenu = Markup.inlineKeyboard([
			Markup.button.callback("Kategoriya menyusiga qaytish", `return_to_category_menu`)
		]);

		const categoryName = ctx.message.text;

		if (ctx.session.fromFlag?.fromAddProduct) {
			await ctx.reply(`...loading`, Markup.removeKeyboard())
			
			await Promise.all([
				
				categoryRepo.save({ name: categoryName }),
				ctx.session.fromFlag = { fromAddProduct: false },
				ctx.reply(`Kategoriya "${categoryName}" muvaffaqiyatli qo'shildi!`, returnToAddProduct)
			]);
			
			return ctx.scene.leave();
		};
		
		await ctx.reply(`...loading`, Markup.removeKeyboard())
		await Promise.all([
			categoryRepo.save({ name: categoryName }),
			ctx.reply(`Kategoriya "${categoryName}" muvaffaqiyatli qo'shildi!`, backCategoryMenu)
		]);

		return ctx.scene.leave();
	},
);

// back to category menu from add category wizard
addCategoryWizard.hears(`Back`, async (ctx) => {
	ctx.session.adminBackFlag = true
	ctx.scene.enter('categoryScene')
});


// edit category
categoryScene.hears(`✏️  Tahrirlash`, async (ctx: IMyContext) => {
	await ctx.scene.enter(`editCategoryWizard`)
});

// delete category
categoryScene.hears(`⭕  O'chirish`, async (ctx: IMyContext) => {
	await ctx.scene.enter(`deleteCategoryWizard`)
});

// delete category wizard
export const deleteCategoryWizard = new Scenes.WizardScene<IMyContext>(`deleteCategoryWizard`,

	// 	STEP:1
	async (ctx: IMyContext) => {
		const categories = await categoryList(ctx);
		const chatId = ctx.chat!.id

		const categoryButtons = categories.map((cat, index) =>
			Markup.button.callback(
				`${index + 1}. ${cat.name}`,
				`cat_${cat.id}`
			)
		)

		await ctx.telegram.sendMessage(chatId, `Qaysi kategoriyani ochirmoqchimisiz, raqamni kiriting.\n\n⚠️ Yodda tuting kategory ochirilganda unga bog'liq mahsulotlar ham o'chadi`, Markup.inlineKeyboard(categoryButtons, { columns: 2 }));

		return ctx.wizard.next()
	},

	// 	STEP:2
	async (ctx: IMyContext) => {
		try {

			if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
				await ctx.reply("Iltimos, kategoriyani tanlang.");
				return;
			}

			const chatId = ctx.chat!.id;
			const categoryId = ctx.callbackQuery.data.split("_")[1];

			const result = await deleteCategoryByID(ctx, categoryId);

			const returnMenu = Markup.inlineKeyboard([[Markup.button.callback(`Menyuga qaytish ↩️`, `add_category`)]]);

			if (result) {
				await ctx.telegram.sendMessage(chatId, `...loading`, Markup.removeKeyboard())
				await ctx.telegram.sendMessage(chatId, `✅ Category o'chirildi`, returnMenu);
				return ctx.scene.leave()
			}

			await ctx.answerCbQuery()
			await ctx.telegram.sendMessage(chatId, `Bunday Categoriya mavjud emas`, returnMenu);
			return ctx.scene.leave()
		} catch (error: any) {
			console.error(error);
			await ctx.reply("Xatolik yuz berdi. Keyinroq urinib ko‘ring.");
			return ctx.scene.leave();
		}
	},
)