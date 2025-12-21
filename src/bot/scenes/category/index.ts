import { IMyContext } from "@bot/my-context";
import { Scenes } from "telegraf";
import { addCategoryWizard, categoryScene } from "./category.scene";


export const categoryStage: Scenes.BaseScene<IMyContext>[] = [
	categoryScene,
	addCategoryWizard
];