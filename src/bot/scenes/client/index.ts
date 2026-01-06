import { IMyContext } from "@bot/my-context";
import { Scenes } from "telegraf";
import { clientScene } from "./client.scene";

export const clientStage: Scenes.BaseScene<IMyContext>[] = [
	clientScene
]