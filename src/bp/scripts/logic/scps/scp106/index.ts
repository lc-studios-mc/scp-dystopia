import * as vec3 from "@lib/utils/vec3";
import * as mc from "@minecraft/server";
import { SCP106_ENTITY_TYPE_ID } from "./shared";

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
		case "scpdy_scp106:finish_throw":
			onFinishThrow(event.sourceEntity);
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
		if (isStuck(scp106)) {
			setState(scp106, STATE.diving);
			scp106.triggerEvent("lc:disable_free_movement");
		}
	} else if (state === STATE.hidden) {
		scp106.addEffect("invisibility", 12, { showParticles: false });
	}
}

function onFinishDive(scp106: mc.Entity): void {
	scp106.addEffect("invisibility", 12, { showParticles: false });

	scp106.tryTeleport({
		x: scp106.location.x,
		y: scp106.location.y - 1.5,
		z: scp106.location.z,
	});

	scp106.triggerEvent("lc:hide");
	scp106.triggerEvent("lc:disable_ambient_sound");

	setState(scp106, STATE.hidden);
}

function onFinishAppear(scp106: mc.Entity): void {
	setState(scp106, STATE.default);
	scp106.triggerEvent("lc:enable_free_movement");
}

function onFinishThrow(scp106: mc.Entity): void {
	setState(scp106, STATE.default);
	scp106.triggerEvent("lc:enable_free_movement");
}

function isStuck(scp106: mc.Entity): boolean {
	const stuckDuration = getStuckDuration(scp106);
	return stuckDuration > 4;
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
