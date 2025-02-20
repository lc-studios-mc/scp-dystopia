import * as mc from "@minecraft/server";
import { PWR_NODE_ENTITY_TYPE } from "./shared";
import { getRelativeBlock } from "@lib/utils/blockUtils";

mc.world.beforeEvents.worldInitialize.subscribe((event) => {
	event.itemComponentRegistry.registerCustomComponent("scpdy:pwr_node_placer", {
		onUseOn(arg) {
			const spawnLoc = getRelativeBlock(arg.block, arg.blockFace, 1)!.center();
			arg.block.dimension.spawnEntity(PWR_NODE_ENTITY_TYPE, spawnLoc);
		},
		onUse(arg) {
			mc.world.sendMessage("e");
		},
	});
});
