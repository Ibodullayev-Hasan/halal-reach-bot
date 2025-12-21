import { Scenes } from "telegraf";
import { IMyContext } from "@bot/my-context";
import { addAdminScene, changeRoleScenes, settingsScenes, superAdminScene } from "./super.admin.scene";

export const superAdminStage: Scenes.BaseScene<IMyContext>[] = [
	superAdminScene,
	addAdminScene,
	settingsScenes,
	changeRoleScenes
];