import { Context, Scenes } from "telegraf";

interface MySceneSession extends Scenes.SceneSessionData {
	flag: boolean;
	fromSettings?: boolean;
	cursor: number;
	current: string;
};

interface MySession extends Scenes.WizardSession<MySceneSession> {
	superAdminBackFlag?: boolean
	adminBackFlag?: boolean
	roleMessageId?: number
	categoryId?: string;	
	name?: string;
	price?: number;
	productImg?: string;
	description?: string;
	orderId?: string;
	productId?: string;
	
}

export interface IMyContext extends Scenes.WizardSession<MySceneSession>, Context {
	session: MySession;

	scene: Scenes.SceneContextScene<IMyContext, MySceneSession>;

	wizard: Scenes.WizardContextWizard<IMyContext>;
};