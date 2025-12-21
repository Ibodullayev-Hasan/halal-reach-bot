
export const keepSceneAlive = async (ctx: any, next: () => Promise<void>) => {
	ctx.scene?.resetLeaveTimer?.();
	return next();
};