import { Scenes } from "telegraf";
import { IMyContext } from "@bot/my-context";
import { addAdminScene, changeRoleScenes, settingsScenes, superAdminScene } from "./super.admin.scene";
import { addProductWizard, adminScene, orderScene, productScene, statisticsScene } from "./admin.scene";
import { addCategoryWizard, categoryScene } from "./category.scene";

export const adminStage: Scenes.BaseScene<IMyContext>[] = [
	superAdminScene,
	addAdminScene,
	settingsScenes,
	changeRoleScenes,
	adminScene,
	productScene,
	orderScene,
	statisticsScene,
	addProductWizard,
	categoryScene,
	addCategoryWizard
];