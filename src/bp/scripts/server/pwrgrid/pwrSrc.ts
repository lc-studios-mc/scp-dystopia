import * as mc from "@minecraft/server";
import { PWR_SRC_ENTITY_TYPE } from "./shared";

mc.world.afterEvents.entityDie.subscribe(
	(event) => {
		const wasKilledByCreativePlayer =
			event.damageSource.damagingEntity instanceof mc.Player &&
			event.damageSource.damagingEntity.getGameMode() === mc.GameMode.creative;

		if (mc.world.gameRules.doMobLoot && !wasKilledByCreativePlayer) {
			const loot = new mc.ItemStack("lc:scpdy_pwr_src_placer", 1);
			event.deadEntity.dimension.spawnItem(loot, event.deadEntity.location);
		}

		event.deadEntity.remove();
	},
	{
		entityTypes: [PWR_SRC_ENTITY_TYPE],
	},
);
