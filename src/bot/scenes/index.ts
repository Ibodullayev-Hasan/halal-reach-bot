import { Scenes } from "telegraf";
import { IMyContext } from '@bot/my-context';
import { adminStage } from "@bot/scenes/admin";
import { superAdminStage } from './super-admin';
import { categoryStage } from './category';
import { productStage } from "./product";
import { orderStage } from "./order";
import { statisticsStage } from "./statistcs";

export const myStage = new Scenes.Stage<IMyContext>(
    [
        ...adminStage,
        ...superAdminStage,
        ...categoryStage,
        ...productStage,
        ...orderStage,
        ...statisticsStage,
    ],
    { ttl: 3600_000 }
);