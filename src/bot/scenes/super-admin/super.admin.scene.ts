import { Markup, Scenes } from "telegraf";
import { IMyContext } from "@bot/my-context";
import { UserRoles } from "enums/roles.enum";
import { SuperAdminEvent } from "@bot/events/super.admin.events";
import { setRoleAndExit } from "./utils/setRoleAndExit";

const event = new SuperAdminEvent();

// Timeout ni o‘chirish uchun universal middleware
const keepSceneAlive = async (ctx: any, next: () => Promise<void>) => {
	ctx.scene?.resetLeaveTimer?.();
	return next();
};
/* ====================== SUPER ADMIN SCENE ====================== */
export const superAdminScene = new Scenes.BaseScene<IMyContext>("superAdmin");
superAdminScene.use(keepSceneAlive);

superAdminScene.enter(async (ctx) => {

	const keyboard = Markup.keyboard([
		["📊  Statistika", "⚙️  Settings"],
		["🆕  Yangi Admin"],
		["🛑  Chiqish"],
	]).resize();

	if (ctx.session.superAdminBackFlag) {
		await ctx.reply("Menyuga qaytildi", keyboard);
		ctx.session.superAdminBackFlag = false;
		return;
	}

	await ctx.reply("Assalomu alaykum Super Admin! Kayfiyat 100% mi", keyboard);
});

superAdminScene.hears("📊  Statistika", (ctx) => event.statistics(ctx));
superAdminScene.hears("🆕  Yangi Admin", (ctx) => ctx.scene.enter("addAdmin"));
superAdminScene.hears("⚙️  Settings", (ctx) => ctx.scene.enter("settings"));
superAdminScene.hears("🛑  Chiqish", async (ctx) => {
	await Promise.all([
		ctx.scene.leave(),
		ctx.reply("Super admin paneldan chiqdingiz", Markup.removeKeyboard())
	]);
});

/* ====================== ADD ADMIN SCENE ====================== */
export const addAdminScene = new Scenes.BaseScene<IMyContext>("addAdmin");
addAdminScene.use(keepSceneAlive);

addAdminScene.enter(async (ctx) => {
	await ctx.reply(
		"Yangi admin qo‘shish uchun username kiriting:\nMasalan: @username",
		Markup.keyboard([["Back"]]).resize()
	);
});

addAdminScene.hears("Back", async (ctx) => {
	ctx.session.superAdminBackFlag = true;
	await ctx.scene.enter("superAdmin");
});

// Faqat @ bilan boshlangan xabarlarni qabul qilamiz
addAdminScene.on("text", async (ctx) => {
	const username = ctx.message.text.trim();

	if (!username.startsWith('@')) {
		await ctx.reply('Username @ bilan boshlanishi kerak. Qaytadan kiriting.');
		return; // Qayta kutish
	}

	await event.newAdmin(ctx, username)
	await ctx.scene.leave();
});


/* ====================== SETTINGS SCENE ====================== */
export const settingsScenes = new Scenes.BaseScene<IMyContext>("settings");
settingsScenes.use(keepSceneAlive);

settingsScenes.enter(async (ctx) => {
	const keyboard = Markup.keyboard([
		["Change role", "Language"],
		["Back"],
	]).resize();

	await ctx.reply("Super Admin — Sozlamalar", keyboard);
});

settingsScenes.hears("Change role", (ctx) => ctx.scene.enter("changeRole"));

settingsScenes.hears("Language", (ctx) => ctx.reply("Tez orada qo‘shiladi"));

settingsScenes.hears("Back", async (ctx) => {
	ctx.session.superAdminBackFlag = true;
	await ctx.scene.enter("superAdmin");
});

/* ====================== CHANGE ROLE SCENE ====================== */
export const changeRoleScenes = new Scenes.BaseScene<IMyContext>("changeRole");
changeRoleScenes.use(keepSceneAlive);

changeRoleScenes.enter(async (ctx) => {

	await ctx.reply('⏳...', {
		reply_markup: { remove_keyboard: true }
	});

	const rolesKeyboard = Markup.inlineKeyboard([
		[
			Markup.button.callback("Admin", "role_admin"),
			Markup.button.callback("Client", "role_client"),
			Markup.button.callback("Courier", "role_courier"),
			Markup.button.callback("Super Admin", "role_super_admin")
		],
		[Markup.button.callback("Back", "back_to_settings")],
	]);

	const msg = await ctx.reply("Rolni tanlang:", rolesKeyboard);
	ctx.session.roleMessageId = msg.message_id;
});

// Inline tugmalar
changeRoleScenes.action("role_super_admin", async (ctx) => await setRoleAndExit(ctx, UserRoles.SUPER_ADMIN));
changeRoleScenes.action("role_admin", async (ctx) => await setRoleAndExit(ctx, UserRoles.ADMIN));
changeRoleScenes.action("role_client", async (ctx) => await setRoleAndExit(ctx, UserRoles.CLIENT));
changeRoleScenes.action("role_courier", async (ctx) => await setRoleAndExit(ctx, UserRoles.COURIER));

changeRoleScenes.action("back_to_settings", async (ctx) => {
	await ctx.deleteMessage().catch(() => { });
	ctx.session.roleMessageId = null;
	ctx.session.superAdminBackFlag = true;
	await ctx.scene.enter("settings");
});
