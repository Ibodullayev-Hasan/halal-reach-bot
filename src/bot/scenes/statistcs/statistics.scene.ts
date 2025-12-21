import { IMyContext } from "@bot/my-context";
import { Markup, Scenes } from "telegraf";
import { keepSceneAlive } from "@bot/utils";


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