import { IMyContext } from '@bot/my-context';
import { adminStage } from "@bot/scenes/admin";  // Admin sceneni import qilish
import { Scenes } from "telegraf";

export const myStage = new Scenes.Stage<IMyContext>(
    [...adminStage], 
    { ttl: 3600_000 }
);