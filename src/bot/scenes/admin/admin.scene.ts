import { IMyContext } from "@bot/my-context";
import { Markup, Scenes } from "telegraf";
import { keepSceneAlive } from "@bot/utils";

/* ====================== admin SCENE ====================== */
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
