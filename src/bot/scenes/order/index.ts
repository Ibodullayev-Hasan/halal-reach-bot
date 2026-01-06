import { IMyContext } from "@bot/my-context";
import { Scenes } from "telegraf";
import { newOrderWizard, orderListWizard, orderScene } from "./order.scene";

export const orderStage: Scenes.BaseScene<IMyContext>[] = [
	orderScene,
	orderListWizard,
	newOrderWizard
];