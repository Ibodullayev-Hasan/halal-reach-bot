import { Scenes, Context } from "telegraf";

// Sizning custom state interfeysingiz (MySceneSession dan foydalaning)
import { IMyContext, MySceneSession } from "../my-context";  // Fayl yo'lini o'zgartiring

declare module "telegraf" {
    namespace Scenes {
        interface WizardContext extends IMyContext {
            wizard: {
                state: MySceneSession;  // Bu yerda custom tipingizni qo'ying
            } & Scenes.WizardContextWizard<WizardContext>;
        }
    }
};