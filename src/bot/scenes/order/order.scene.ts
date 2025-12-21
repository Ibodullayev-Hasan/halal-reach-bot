import { IMyContext } from "@bot/my-context";
import { Markup, Scenes } from "telegraf";
import { keepSceneAlive } from "@bot/utils";

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
