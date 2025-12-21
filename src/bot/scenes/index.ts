import { Scenes } from "telegraf";
import { IMyContext } from '@bot/my-context';
import { adminStage } from "@bot/scenes/admin";  
import { superAdminStage } from './super-admin';
import { categoryStage } from './category';

export const myStage = new Scenes.Stage<IMyContext>(
    [...adminStage, ...superAdminStage, ...categoryStage],
    { ttl: 3600_000 }
);