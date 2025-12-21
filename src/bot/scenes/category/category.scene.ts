import { IMyContext } from "@bot/my-context";
import { categoryRepo } from "db/repositories";
import { Markup, Scenes } from "telegraf";


const keepSceneAlive = async (ctx: any, next: () => Promise<void>) => {
	ctx.scene?.resetLeaveTimer?.();
	return next();
};

export const categoryScene = new Scenes.BaseScene<IMyContext>(`categoryScene`);

categoryScene.use(keepSceneAlive);

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

		const inlineNavigation = Markup.inlineKeyboard([
			Markup.button.callback("Mahsulot qo'shishga qaytish", `return_to_add_product`)
		]);

		const categoryName = ctx.message.text;

		await Promise.all([
			categoryRepo.save({ name: categoryName }),
			ctx.reply(`Kategoriya "${categoryName}" muvaffaqiyatli qo'shildi!`, inlineNavigation)
		]);

		return ctx.scene.leave();
	},
);

addCategoryWizard.hears(`Back`, async (ctx) => {
	ctx.session.adminBackFlag = true
	ctx.scene.enter('categoryScene')
});

// category keyboards and greetings
categoryScene.enter(async (ctx) => {

	const categoryMenuKeyboard = Markup.keyboard([
		[`🆕  Qo'shish`, `✏️  Tahrirlash`],
		[`📋  Kategoriyalar`, `⭕  O'chirish`],
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
categoryScene.hears(`📋  Kategoriyalar`, async (ctx: IMyContext) => {
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

// edit category
categoryScene.hears(`✏️  Tahrirlash`, async (ctx: IMyContext) => {
	await ctx.scene.enter(`editCategoryWizard`)
});

// delete category
categoryScene.hears(`⭕  O'chirish`, async (ctx: IMyContext) => {
	await ctx.scene.enter(`deleteCategoryWizard`)
});	