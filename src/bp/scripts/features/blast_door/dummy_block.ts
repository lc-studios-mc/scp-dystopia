import { removeBlastDoorAtBlock } from "./blast_door";
import * as mc from "@minecraft/server";

function onPlayerDestroy(arg: mc.BlockComponentPlayerDestroyEvent): void {
	removeBlastDoorAtBlock(arg.block);
}

mc.system.beforeEvents.startup.subscribe((event) => {
	event.blockComponentRegistry.registerCustomComponent("scpdy:blast_door_dummy", {
		onPlayerDestroy,
	});
});
