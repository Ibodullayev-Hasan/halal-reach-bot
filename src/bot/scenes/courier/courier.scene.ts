import { IMyContext } from "@bot/my-context";
import { keepSceneAlive } from "@bot/utils";
import { Markup, Scenes } from "telegraf";

export const courierScene = new Scenes.BaseScene<IMyContext>(`courier`);

courierScene.use(keepSceneAlive);

courierScene.enter(async (ctx) => {
	const courierMenuKeyboard = Markup.keyboard([
		[`🛒  Buyurtma berish`, `🧺  Buyurtmalarim`],
		[`🛑  Chiqish`]
	]).resize();

	await ctx.reply(`Assalomu aleykum  👋  courier - ${ctx.from.first_name}`, courierMenuKeyboard);
});


courierScene.hears(`🛑  Chiqish`, async (ctx) => {
	await Promise.all([
		ctx.scene.leave(),
		ctx.reply("👷  Courier paneldan chiqdingiz", Markup.removeKeyboard())
	]);
});

courierScene.hears(`🧺  Buyurtmalarim`, async (ctx) => {
	await ctx.reply("Sizning buyurtmalaringiz ro'yxati hozircha tayyor emas.");
});

export const addCourier = new Scenes.WizardScene<IMyContext>(`addCourier`, 
	async(ctx:IMyContext) => {
		await ctx.reply(`Hali tayyor emas`)
	}
)

