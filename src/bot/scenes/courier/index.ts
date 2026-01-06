import { IMyContext } from "@bot/my-context";
import { Scenes } from "telegraf";
import { addCourier, courierScene } from "./courier.scene";

export const courierStage: Scenes.BaseScene<IMyContext>[] = [
	courierScene,
	addCourier
]