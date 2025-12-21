import { IMyContext } from "@bot/my-context";
import { Scenes } from "telegraf";
import { productScene, addProductWizard, productListWizard } from "./product.scene";

export const productStage: Scenes.BaseScene<IMyContext>[] = [
	productScene,
	addProductWizard,
	productListWizard
];