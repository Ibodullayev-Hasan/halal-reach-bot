import { IMyContext } from "@bot/my-context";
import { keepSceneAlive } from "@bot/utils";
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
	await ctx.scene.enter(`orderListWizard`)
});


