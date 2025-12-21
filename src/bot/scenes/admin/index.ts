import { Scenes } from "telegraf";
import { IMyContext } from "@bot/my-context";
import { adminScene } from "./admin.scene";

export const adminStage: Scenes.BaseScene<IMyContext>[] = [
	adminScene
];
