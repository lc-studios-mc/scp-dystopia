import * as mc from "@minecraft/server";
import * as vec3 from "@lib/utils/vec3";
import {
	getCorrosionAcquisitionCooldown,
	getCorrosionLeft,
	getCorrosionRight,
	getCorrosionThrowCooldown,
	getState,
	SCP106_ENTITY_TYPE_ID,
	SCP106_STATE,
	setCorrosionAcquisitionCooldown,
	setCorrosionLeft,
	setCorrosionRight,
	setCorrosionThrowCooldown,
} from "./shared";
import { randomInt } from "@/lib/utils/mathUtils";

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

mc.world.afterEvents.entitySpawn.subscribe((event) => {
	if (event.entity.typeId !== SCP106_ENTITY_TYPE_ID) return;
	onSpawn(event.entity);
});

function onSpawn(scp106: mc.Entity): void {
	setCorrosionAcquisitionCooldown(scp106, 7);
	setCorrosionThrowCooldown(scp106, 7);
}

/** This function should be called for each SCP-106 entity every 0.5 seconds. */
function onUpdate(scp106: mc.Entity): void {
	const state = getState(scp106);

	if (state === SCP106_STATE.hidden) {
		onUpdateHiddenState(scp106);
		return;
	}

	const entitiesInContact = scp106.dimension.getEntities({
		closest: 20,
		maxDistance: 1.55,
		location: vec3.add(scp106.location, vec3.UP),
		excludeTypes: [SCP106_ENTITY_TYPE_ID],
	});

	// Give wither (corrosion) effect to entities in contact
	for (const entity of entitiesInContact) {
		mc.system.run(() => {
			entity.addEffect("wither", 100, { amplifier: 1 });
		});
	}

	if (state === SCP106_STATE.default) {
		onUpdateDefaultState(scp106);
	}
}

function onUpdateDefaultState(scp106: mc.Entity): void {
	const target = scp106.target;
	if (!target) return;

	updateCorrosionAcquisitionCooldown(scp106);

	if (!getCorrosionRight(scp106) && !getCorrosionLeft(scp106)) return;

	updateCorrosionThrowCooldown(scp106);
}

function updateCorrosionAcquisitionCooldown(scp106: mc.Entity): void {
	const corrosionAcquisitionCooldown = getCorrosionAcquisitionCooldown(scp106);
	if (corrosionAcquisitionCooldown > 0) {
		setCorrosionAcquisitionCooldown(scp106, corrosionAcquisitionCooldown - 1);
		return;
	}

	acquireCorrosion(scp106);
	setCorrosionAcquisitionCooldown(scp106, randomInt(8, 32));
}

function acquireCorrosion(scp106: mc.Entity): void {
	let right = !getCorrosionRight(scp106) && Math.random() > 0.5;
	if (right) {
		setCorrosionRight(scp106, true);
	} else {
		setCorrosionLeft(scp106, true);
	}
}

function updateCorrosionThrowCooldown(scp106: mc.Entity): void {
	const corrosionThrowCooldown = getCorrosionThrowCooldown(scp106);
	if (corrosionThrowCooldown > 0) {
		setCorrosionThrowCooldown(scp106, corrosionThrowCooldown - 1);
		return;
	}

	setCorrosionThrowCooldown(scp106, randomInt(5, 9));
	throwCorrosion(scp106);
}

function throwCorrosion(scp106: mc.Entity): void {}

function onUpdateHiddenState(scp106: mc.Entity): void {}
