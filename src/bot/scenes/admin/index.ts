import { Scenes } from "telegraf";
import { IMyContext } from "@bot/my-context";
import { addProductWizard, adminScene, orderScene, productScene, statisticsScene } from "./admin.scene";

export const adminStage: Scenes.BaseScene<IMyContext>[] = [
	adminScene,
	productScene,
	orderScene,
	statisticsScene,
	addProductWizard
];
