import * as mc from "@minecraft/server";
import * as vec3 from "@lib/utils/vec3";
import {
	getCorrosionAcquisitionCooldown,
	getCorrosionLeft,
	getCorrosionRight,
	getCorrosionThrowCooldown,
	getLastLocation,
	getState,
	getStuckDuration,
	SCP106_ENTITY_TYPE_ID,
	SCP106_STATE,
	setCorrosionAcquisitionCooldown,
	setCorrosionLeft,
	setCorrosionRight,
	setCorrosionThrowCooldown,
	setLastLocation,
	setState,
	setStuckDuration,
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
			case "scpdy_scp106:finish_dive":
				onFinishDive(scp106);
				break;
			case "scpdy_scp106:finish_throw_right":
				onFinishThrowingCorrosionRight(scp106);
				break;
			case "scpdy_scp106:finish_throw_left":
				onFinishThrowingCorrosionLeft(scp106);
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
		try {
			entity.addEffect("wither", 100, { amplifier: 1 });
		} catch {}
	}

	if (mc.world.getDifficulty() === mc.Difficulty.Hard) {
		scp106.addEffect("speed", 100, { amplifier: 0, showParticles: false });
	}

	if (state === SCP106_STATE.default) {
		onUpdateDefaultState(scp106);
	}
}

function onUpdateDefaultState(scp106: mc.Entity): void {
	if (!scp106.target) return;

	if (isStuck(scp106)) {
		startDive(scp106);
		return;
	}

	updateCorrosionAcquisitionCooldown(scp106);

	if (!getCorrosionRight(scp106) && !getCorrosionLeft(scp106)) return;

	updateCorrosionThrowCooldown(scp106);
}

function isStuck(scp106: mc.Entity): boolean {
	const isTargetNearby =
		scp106.target && vec3.distance(scp106.location, scp106.target.location) <= 2.0;
	return !isTargetNearby && updateStuckDuration(scp106) > 2;
}

function updateStuckDuration(scp106: mc.Entity): number {
	const lastLocation = getLastLocation(scp106);

	setLastLocation(scp106, scp106.location);

	if (!lastLocation || vec3.distance(lastLocation, scp106.location) > 0.3) {
		setStuckDuration(scp106, 0);
		return 0;
	}

	const stuckDuration = getStuckDuration(scp106);

	setStuckDuration(scp106, stuckDuration + 1);

	return stuckDuration;
}

function startDive(scp106: mc.Entity): void {
	setState(scp106, SCP106_STATE.diving);
	setStuckDuration(scp106, 0);

	scp106.triggerEvent("lc:disable_free_movement");
}

function updateCorrosionAcquisitionCooldown(scp106: mc.Entity): void {
	const corrosionAcquisitionCooldown = getCorrosionAcquisitionCooldown(scp106);
	if (corrosionAcquisitionCooldown > 0) {
		setCorrosionAcquisitionCooldown(scp106, corrosionAcquisitionCooldown - 1);
		return;
	}

	const newCooldown =
		mc.world.getDifficulty() === mc.Difficulty.Hard ? randomInt(3, 5) : randomInt(8, 12);

	setCorrosionAcquisitionCooldown(scp106, newCooldown);

	acquireCorrosion(scp106);
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

	if (!scp106.target) return;
	if (vec3.distance(scp106.location, scp106.target.location) < 3.5) return;

	const raycastHitsInTargetDir = scp106.dimension.getEntitiesFromRay(
		scp106.getHeadLocation(),
		vec3.normalize(vec3.sub(scp106.target.getHeadLocation(), scp106.getHeadLocation())),
		{ maxDistance: 32, type: scp106.target.typeId },
	);

	const isSeeingTarget = raycastHitsInTargetDir.some((x) => x.entity === scp106.target);

	if (!isSeeingTarget) return; // Do not throw corrosion when cannot see target

	const newCooldown =
		mc.world.getDifficulty() === mc.Difficulty.Hard ? randomInt(1, 2) : randomInt(2, 4);

	setCorrosionThrowCooldown(scp106, newCooldown);
	throwCorrosion(scp106);
}

function throwCorrosion(scp106: mc.Entity): void {
	if (!scp106.target) return;

	const rightCorrosion = getCorrosionRight(scp106);
	const leftCorrosion = getCorrosionLeft(scp106);

	if (!rightCorrosion && !leftCorrosion) return;

	let doRight = false;

	if (rightCorrosion && leftCorrosion) {
		doRight = Math.random() > 0.5;
	} else {
		doRight = rightCorrosion;
	}

	if (doRight) {
		setState(scp106, SCP106_STATE.throwingRight);
		setCorrosionRight(scp106, false);
	} else {
		setState(scp106, SCP106_STATE.throwingLeft);
		setCorrosionLeft(scp106, false);
	}

	scp106.lookAt(scp106.target.getHeadLocation());
	scp106.triggerEvent("lc:disable_free_movement");
	scp106.triggerEvent("lc:add_throwing_corrosion");
}

function onFinishThrowingCorrosionRight(scp106: mc.Entity): void {
	onFinishThrowingCorrosion(scp106);
}

function onFinishThrowingCorrosionLeft(scp106: mc.Entity): void {
	onFinishThrowingCorrosion(scp106);
}

function onFinishThrowingCorrosion(scp106: mc.Entity): void {
	setState(scp106, SCP106_STATE.default);
	scp106.triggerEvent("lc:enable_free_movement");
	scp106.triggerEvent("lc:remove_throwing_corrosion");
}

function onFinishDive(scp106: mc.Entity): void {
	setState(scp106, SCP106_STATE.hidden);
	scp106.clearVelocity();
	scp106.triggerEvent("lc:hide");
	scp106.triggerEvent("lc:disable_ambient_sound");
	scp106.tryTeleport({ x: scp106.location.x, y: scp106.location.y - 0.6, z: scp106.location.z });
}

function onUpdateHiddenState(scp106: mc.Entity): void {
	mc.system.run(() => {
		scp106.addEffect("invisibility", 30, { showParticles: false });
	});
}
