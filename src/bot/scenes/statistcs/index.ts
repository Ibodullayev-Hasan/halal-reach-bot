import { IMyContext } from "@bot/my-context";
import { Scenes } from "telegraf";
import { statisticsScene } from "./statistics.scene";

export const statisticsStage: Scenes.BaseScene<IMyContext>[] = [
	statisticsScene
];