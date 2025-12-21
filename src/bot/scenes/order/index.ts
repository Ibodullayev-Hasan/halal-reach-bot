import { IMyContext } from "@bot/my-context";
import { Scenes } from "telegraf";
import { orderScene } from "./order.scene";

export const orderStage: Scenes.BaseScene<IMyContext>[] = [
	orderScene
];