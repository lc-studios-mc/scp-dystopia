import * as mc from "@minecraft/server";

export const SCP106_ENTITY_TYPE_ID = "lc:scpdy_scp106";

export const SCP106_STATE = {
	default: 0,
	diving: 10,
	hidden: 20,
	appearingSlow: 30,
	appearingFast: 40,
	throwingRight: 50,
	throwingLeft: 60,
	retreating: 70,
} as const;

export function getState(scp106: mc.Entity): number {
	return Number(scp106.getProperty("lc:state"));
}

export function setState(scp106: mc.Entity, value: number): void {
	scp106.setProperty("lc:state", value);
}

export function getCorrosionRight(scp106: mc.Entity): boolean {
	return scp106.getProperty("lc:corrosion_right") === true;
}

export function setCorrosionRight(scp106: mc.Entity, value: boolean): void {
	scp106.setProperty("lc:corrosion_right", value);
}

export function getCorrosionLeft(scp106: mc.Entity): boolean {
	return scp106.getProperty("lc:corrosion_left") === true;
}

export function setCorrosionLeft(scp106: mc.Entity, value: boolean): void {
	scp106.setProperty("lc:corrosion_left", value);
}

export function getCorrosionAcquisitionCooldown(scp106: mc.Entity): number {
	const value = Number(scp106.getDynamicProperty("corrosionAcquisitionCooldown"));
	return isNaN(value) ? 0 : value;
}

export function setCorrosionAcquisitionCooldown(scp106: mc.Entity, value: number): void {
	scp106.setDynamicProperty("corrosionAcquisitionCooldown", value);
}

export function getCorrosionThrowCooldown(scp106: mc.Entity): number {
	const value = Number(scp106.getDynamicProperty("corrosionThrowCooldown"));
	return isNaN(value) ? 0 : value;
}

export function setCorrosionThrowCooldown(scp106: mc.Entity, value: number): void {
	scp106.setDynamicProperty("corrosionThrowCooldown", value);
}

export function getLastLocation(scp106: mc.Entity) {
	return scp106.getDynamicProperty("lastLocation") as mc.Vector3 | undefined;
}

export function setLastLocation(scp106: mc.Entity, value?: mc.Vector3): void {
	scp106.setDynamicProperty("lastLocation", value);
}

export function getStuckDuration(scp106: mc.Entity): number {
	const value = Number(scp106.getDynamicProperty("stuckDuration"));
	return isNaN(value) ? 0 : value;
}

export function setStuckDuration(scp106: mc.Entity, value: number): void {
	scp106.setDynamicProperty("stuckDuration", value);
}
