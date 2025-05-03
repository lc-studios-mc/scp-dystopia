import * as vec3 from "@lib/utils/vec3";
import * as mc from "@minecraft/server";
import { SCP106_ENTITY_TYPE_ID } from "./shared";
import { getRiseLocation } from "./utils";

const STATE = {
	default: 0,
	diving: 1,
	hidden: 2,
	appearingSlow: 3,
	appearingFast: 4,
	throwingRight: 5,
	throwingLeft: 6,
} as const;

mc.system.afterEvents.scriptEventReceive.subscribe(event => {
	if (!event.sourceEntity) return;
	if (event.sourceEntity.typeId !== SCP106_ENTITY_TYPE_ID) return;
	if (!event.sourceEntity.isValid) return;

	switch (event.id) {
		case "scpdy_scp106:update":
			onUpdate(event.sourceEntity);
			break;
		case "scpdy_scp106:finish_dive":
			onFinishDive(event.sourceEntity);
			break;
		case "scpdy_scp106:finish_appear":
			onFinishAppear(event.sourceEntity);
			break;
		case "scpdy_scp106:finish_throw_right":
			onFinishThrow(event.sourceEntity, "right");
			break;
		case "scpdy_scp106:finish_throw_left":
			onFinishThrow(event.sourceEntity, "left");
			break;
	}
}, {
	namespaces: ["scpdy_scp106"],
});

function onUpdate(scp106: mc.Entity): void {
	// Stop riding something
	mc.system.run(() => {
		scp106.runCommand("ride @s stop_riding");
	});

	const state = getState(scp106);

	if (state === STATE.default) {
		onUpdateDefault(scp106);
	} else if (state === STATE.hidden) {
		onUpdateHidden(scp106);
	}
}

function onUpdateDefault(scp106: mc.Entity): void {
	if (!scp106.target) return;

	const targetDist = vec3.distance(scp106.target.location, scp106.location);
	const isInContactWithTarget = targetDist <= 0.6;

	if (!isInContactWithTarget && isStuck(scp106)) {
		setState(scp106, STATE.diving);
		scp106.addTag("scpdy_ignore_slasher_capture");
		scp106.triggerEvent("lc:disable_free_movement");
		return;
	}

	// Give wither effect to contacting entities
	for (
		const entity of scp106.dimension.getEntities({
			location: vec3.add(scp106.location, vec3.UP),
			maxDistance: 1.3,
			closest: 10,
			excludeTypes: [SCP106_ENTITY_TYPE_ID],
		})
	) {
		try {
			entity.addEffect("wither", 60, { amplifier: 1 });
		} catch {}
	}

	if (targetDist <= 6) return;

	const isSeeingTarget = scp106.dimension.getEntitiesFromRay(
		scp106.getHeadLocation(),
		vec3.normalize(vec3.sub(scp106.target.location, scp106.getHeadLocation())),
		{ maxDistance: 30, type: scp106.target.typeId },
	).some(x => x.entity === scp106.target);

	if (!isSeeingTarget) return;

	if (getCorrosionLeft(scp106)) {
		setState(scp106, STATE.throwingLeft);
		scp106.triggerEvent("lc:disable_free_movement");
		scp106.lookAt(scp106.target.location);
	} else if (getCorrosionRight(scp106)) {
		setState(scp106, STATE.throwingRight);
		scp106.triggerEvent("lc:disable_free_movement");
		scp106.lookAt(scp106.target.location);
	}
}

function onUpdateHidden(scp106: mc.Entity): void {
	let totalTick = scp106.getDynamicProperty("hiddenTotalTick");
	if (typeof totalTick !== "number") {
		totalTick = 0;
	}

	let riseLocation = scp106.getDynamicProperty("riseLocation") as mc.Vector3 | undefined;
	if (!riseLocation) {
		riseLocation = getRiseLocation(scp106);
		scp106.setDynamicProperty("riseLocation", riseLocation);
	}

	if (totalTick === 1) {
		scp106.tryTeleport(vec3.add(riseLocation, vec3.DOWN));
	} else if (totalTick === 2) {
		if (scp106.target) scp106.lookAt(scp106.target.location);

		// TODO: Particle
	} else if (totalTick === 4) {
		setState(scp106, STATE.appearingFast);
		scp106.removeEffect("invisibility");
		scp106.triggerEvent("lc:show");
		scp106.tryTeleport(riseLocation);
		scp106.setDynamicProperty("hiddenTotalTick", undefined);
		scp106.setDynamicProperty("riseLocation", undefined);
		setCorrosionRight(scp106, true);
		setCorrosionLeft(scp106, true);
		return;
	}

	scp106.setDynamicProperty("hiddenTotalTick", totalTick + 1);
	scp106.addEffect("invisibility", 12, { showParticles: false });
	scp106.clearVelocity();
}

function onFinishDive(scp106: mc.Entity): void {
	scp106.addEffect("invisibility", 12, { showParticles: false });

	scp106.tryTeleport({
		x: scp106.location.x,
		y: scp106.location.y - 1.0,
		z: scp106.location.z,
	});

	scp106.triggerEvent("lc:hide");
	scp106.triggerEvent("lc:disable_ambient_sound");

	setState(scp106, STATE.hidden);
}

function onFinishAppear(scp106: mc.Entity): void {
	setState(scp106, STATE.default);
	scp106.removeTag("scpdy_ignore_slasher_capture");
	scp106.triggerEvent("lc:enable_free_movement");
}

function onFinishThrow(scp106: mc.Entity, which: "left" | "right"): void {
	if (which === "left") {
		setCorrosionLeft(scp106, false);
	} else {
		setCorrosionRight(scp106, false);
	}

	mc.system.runTimeout(() => {
		setState(scp106, STATE.default);
		scp106.triggerEvent("lc:enable_free_movement");
	}, 1);
}

function isStuck(scp106: mc.Entity): boolean {
	const stuckDuration = getStuckDuration(scp106);
	return stuckDuration > 3;
}

function getStuckDuration(scp106: mc.Entity): number {
	const lastLocation = scp106.getDynamicProperty("lastLocation") as mc.Vector3 | undefined;
	let hasNotMoved = false;
	if (lastLocation) {
		const distance = vec3.distance(lastLocation, scp106.location);
		if (distance <= 0.22) {
			hasNotMoved = true;
		}
	}
	scp106.setDynamicProperty("lastLocation", scp106.location);

	let stuckDuration = scp106.getDynamicProperty("stuckDuration");
	if (typeof stuckDuration !== "number") {
		stuckDuration = 0;
	}

	if (hasNotMoved) stuckDuration++;
	else stuckDuration = 0;

	scp106.setDynamicProperty("stuckDuration", stuckDuration);

	return stuckDuration;
}

function getState(scp106: mc.Entity): number {
	return scp106.getProperty("lc:state") as number;
}

function setState(scp106: mc.Entity, value: number): void {
	scp106.setProperty("lc:state", value);
}

function getCorrosionRight(scp106: mc.Entity): boolean {
	return scp106.getProperty("lc:corrosion_right") === true;
}

function setCorrosionRight(scp106: mc.Entity, value: boolean): void {
	scp106.setProperty("lc:corrosion_right", value);
}

function getCorrosionLeft(scp106: mc.Entity): boolean {
	return scp106.getProperty("lc:corrosion_left") === true;
}

function setCorrosionLeft(scp106: mc.Entity, value: boolean): void {
	scp106.setProperty("lc:corrosion_left", value);
}
