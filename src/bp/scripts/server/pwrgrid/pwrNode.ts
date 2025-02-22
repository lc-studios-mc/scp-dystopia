import * as mc from "@minecraft/server";
import { getTransmitter, isPowered, PWR_NODE_ENTITY_TYPE, setPowered } from "./shared";

mc.world.afterEvents.dataDrivenEntityTrigger.subscribe(
	(event) => {
		const memTier = mc.system.serverSystemInfo.memoryTier;

		switch (memTier) {
			case mc.MemoryTier.SuperLow:
			case mc.MemoryTier.Low:
				event.entity.triggerEvent("pwr_node:set_script_update_timer:slow");
			case mc.MemoryTier.Mid:
			case mc.MemoryTier.High:
				event.entity.triggerEvent("pwr_node:set_script_update_timer:moderate");
			case mc.MemoryTier.SuperHigh:
				event.entity.triggerEvent("pwr_node:set_script_update_timer:normal");
		}
	},
	{
		entityTypes: [PWR_NODE_ENTITY_TYPE],
		eventTypes: ["pwr_node:set_script_update_timer:auto"],
	},
);

mc.world.afterEvents.entityDie.subscribe(
	(event) => {
		event.deadEntity.remove();
	},
	{
		entityTypes: [PWR_NODE_ENTITY_TYPE],
	},
);

mc.world.afterEvents.dataDrivenEntityTrigger.subscribe(
	(event) => {
		onUpdate(event.entity);
	},
	{
		entityTypes: [PWR_NODE_ENTITY_TYPE],
		eventTypes: ["pwr_node:script_update"],
	},
);

function onUpdate(pwrNode: mc.Entity): void {
	const isNodePowered = isPowered(pwrNode);
	const transmitter = getTransmitter(pwrNode);

	if (!transmitter || !isPowered(transmitter)) {
		if (!isNodePowered) return;

		setPowered(pwrNode, false);

		// TODO play power off sound

		return;
	}

	if (isNodePowered) return;

	setPowered(pwrNode, true);

	// TODO play power on sound
}
