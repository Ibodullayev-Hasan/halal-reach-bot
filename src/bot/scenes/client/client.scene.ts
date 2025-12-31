import { IMyContext } from "@bot/my-context";
import { keepSceneAlive } from "@bot/utils";
import { categoryList } from "modules/categories/category.service";
import { Markup, Scenes } from "telegraf";

export const clientScene = new Scenes.BaseScene<IMyContext>(`client`);

clientScene.use(keepSceneAlive);

clientScene.enter(async (ctx) => {
	const clientMenuKeyboard = Markup.keyboard([
		[`🛒  Buyurtma berish`, `🧺  Buyurtmalarim`],
		[`🛑  Chiqish`]
	]).resize();

	await ctx.reply(`Mijozlar bo'limi`, clientMenuKeyboard);
});


clientScene.hears(`🛑  Chiqish`, async (ctx) => {
	await Promise.all([
		ctx.scene.leave(),
		ctx.reply("Mijoz paneldan chiqdingiz", Markup.removeKeyboard())
	]);
});

clientScene.hears(`🛒  Buyurtma berish`, async (ctx) => ctx.scene.enter(`newOrderWizard`));

clientScene.hears(`🧺  Buyurtmalarim`, async (ctx) => {
	await ctx.reply("Sizning buyurtmalaringiz ro'yxati hozircha tayyor emas.");
});

// new order wizard
export const newOrderWizard = new Scenes.WizardScene<IMyContext>(
	`newOrderWizard`,

	// Step 1: start order
	async (ctx: IMyContext) => {
		const categories = await categoryList(ctx);
		const chatId = ctx.chat!.id;

		if (categories.length === 0) {

			const returnMenu = Markup.inlineKeyboard([[Markup.button.callback(`Menyuga qaytish ↩️`, `return_client_menu`)]])

			await ctx.telegram.sendMessage(chatId, `Afsus mijoz hozircha bizda mahsulotlar yoq 😔 `, Markup.removeKeyboard())
			await ctx.telegram.sendMessage(chatId, `Menyuga qaytish uchun pastdagi tugmani bosing`, returnMenu)
		};

		const categoryButtons = categories.map((cat) => Markup.button.callback(cat.name, `cat_${cat.id}`));

		await ctx.reply(`Buyurtma berish uchun categoryni tanlang`, Markup.inlineKeyboard(categoryButtons, { columns: 2 }));
		return ctx.wizard.next();
	},

	async() => {
		
	}
);
