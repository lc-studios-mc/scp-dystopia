import * as mc from "@minecraft/server";
import * as vec3 from "@lib/utils/vec3";
import { getState, SCP106_ENTITY_TYPE_ID, SCP106_STATE } from "./shared";

mc.system.afterEvents.scriptEventReceive.subscribe(
	(event) => {
		if (!event.sourceEntity) return;
		if (!event.sourceEntity.isValid) return;
		if (event.sourceEntity.typeId !== SCP106_ENTITY_TYPE_ID) return;

		const scp106 = event.sourceEntity;

		switch (event.id) {
			case "scpdy_scp106:update":
				onUpdate(scp106);
				break;
		}
	},
	{
		namespaces: ["scpdy_scp106"],
	},
);

/** This function should be called for each SCP-106 entity every 0.5 seconds. */
function onUpdate(scp106: mc.Entity): void {
	const state = getState(scp106);

	if (state === SCP106_STATE.hidden) return;

	// Give wither effect (corrosion) to entities in contact
	const entitiesInContact = scp106.dimension.getEntities({
		closest: 20,
		maxDistance: 1.9,
		location: vec3.add(scp106.location, vec3.UP),
		excludeTypes: [SCP106_ENTITY_TYPE_ID],
	});
	for (const entity of entitiesInContact) {
		entity.addEffect("wither", 60, { amplifier: 1 });
	}

	if (state === SCP106_STATE.default) {
		onUpdateDefaultState(scp106);
	}
}

function onUpdateDefaultState(scp106: mc.Entity): void {}
