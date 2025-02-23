import * as mc from "@minecraft/server";
import * as vec3 from "@lib/utils/vec3";
import { CONFIG } from "@server/config/configData";

export const MAX_PWR_AVAILABLE_RADIUS = 12;

export const PWR_NODE_ENTITY_TYPE = "lc:scpdy_pwr_node";
export const PWR_SRC_ENTITY_TYPE = "lc:scpdy_pwr_src";

const PWR_SENDER_QUERY_OPTS: mc.EntityQueryOptions = {
	closest: 1,
	maxDistance: MAX_PWR_AVAILABLE_RADIUS,
	families: ["pwr_src_or_node"],
	propertyOptions: [
		{
			propertyId: "lc:is_powered",
			value: true,
		},
	],
};

export function isPwrSrc(entity: mc.Entity): boolean {
	return entity.typeId === "lc:scpdy_pwr_src";
}

export function isPwrNode(entity: mc.Entity): boolean {
	return entity.typeId === "lc:scpdy_pwr_node";
}

export function isPowered(pwrSrcOrNode: mc.Entity): boolean {
	if (!isPwrSrc(pwrSrcOrNode) && !isPwrNode(pwrSrcOrNode)) return false;

	return pwrSrcOrNode.getProperty("lc:is_powered") === true;
}

export function setPowered(pwrSrcOrNode: mc.Entity, value: boolean): void {
	if (!isPwrSrc(pwrSrcOrNode) && !isPwrNode(pwrSrcOrNode)) return;

	pwrSrcOrNode.setProperty("lc:is_powered", value);
}

export function getTransmitter(pwrNode: mc.Entity, removeInvalid = true): mc.Entity | undefined {
	if (!isPwrNode(pwrNode)) return;

	const transmitterId = pwrNode.getDynamicProperty("transmitter");
	if (typeof transmitterId !== "string") return;

	const transmitterEntity = mc.world.getEntity(transmitterId);
	if (!transmitterEntity) {
		if (removeInvalid) pwrNode.setDynamicProperty("transmitter", undefined);
		return;
	}

	return transmitterEntity;
}

export function setTransmitter(pwrNode: mc.Entity, transmitter?: mc.Entity): void {
	if (!isPwrNode(pwrNode)) return;

	if (!transmitter || (!isPwrSrc(transmitter) && !isPwrNode(transmitter))) {
		pwrNode.setDynamicProperty("transmitter", undefined);
		return;
	}

	pwrNode.setDynamicProperty("transmitter", transmitter.id);
}

export function getReceiverNodes(pwrSrcOrNode: mc.Entity, removeInvalid = true): mc.Entity[] {
	if (!isPwrSrc(pwrSrcOrNode) && !isPwrNode(pwrSrcOrNode)) return [];

	const receiverIdListStr = pwrSrcOrNode.getDynamicProperty("receiverIdList");
	if (typeof receiverIdListStr !== "string") return [];

	const receiverIds = receiverIdListStr.split("|");

	if (receiverIds.length <= 0) return [];

	if (receiverIds.length === 1) {
		const entity = mc.world.getEntity(receiverIds[0]!);

		if (!entity) {
			if (removeInvalid) pwrSrcOrNode.setDynamicProperty("receiverIdList", undefined);
			return [];
		}

		return [entity];
	}

	let setChanges = false;

	const receivers = receiverIds.reduce<mc.Entity[]>((acc, id) => {
		const entity = mc.world.getEntity(id);

		if (entity !== undefined) {
			acc.push(entity);
		} else if (removeInvalid) {
			setChanges = true;
		}

		return acc;
	}, []);

	if (setChanges) setReceiverNodes(pwrSrcOrNode, receivers);

	return receivers;
}

export function setReceiverNodes(pwrSrcOrNode: mc.Entity, receiverNodes: mc.Entity[]): void {
	if (!isPwrSrc(pwrSrcOrNode) && !isPwrNode(pwrSrcOrNode)) return;

	const receiverIds: string[] = [];

	for (let i = 0; i < receiverNodes.length; i++) {
		const receiver = receiverNodes[i]!;
		if (!isPwrNode(receiver)) continue;
		receiverIds.push(receiver.id);
	}

	if (receiverIds.length <= 0) {
		pwrSrcOrNode.setDynamicProperty("receiverIdList", undefined);
		return;
	}

	const receiverIdListStr = receiverIds.join("|");

	pwrSrcOrNode.setDynamicProperty("receiverIdList", receiverIdListStr);
}

export function isPowerAvailableAt(
	dimension: mc.Dimension,
	location: mc.Vector3,
	interactingPlayer?: mc.Player,
): boolean {
	if (!CONFIG.enablePwrgridSystem) return true;

	PWR_SENDER_QUERY_OPTS.location = location;

	const entity = dimension.getEntities(PWR_SENDER_QUERY_OPTS)[0];

	const isPowered = entity !== undefined;

	if (!isPowered && interactingPlayer) {
		interactingPlayer.onScreenDisplay.setActionBar({
			translate: "scpdy.actionHint.pwrgrid.noElectricalPower",
		});
	}

	return isPowered;
}

mc.system.afterEvents.scriptEventReceive.subscribe(
	(event) => {
		if (event.id !== "scpdy:pwr_check") return;

		const dim: mc.Dimension =
			event.sourceBlock?.dimension ??
			event.sourceEntity?.dimension ??
			mc.world.getDimension("overworld");

		const loc: mc.Vector3 = event.sourceBlock?.center() ??
			event.sourceEntity?.location ?? { x: 0, y: 0, z: 0 };

		const value = isPowerAvailableAt(dim, loc);

		mc.world.sendMessage(
			`Power availability at ${vec3.toString(vec3.round(loc))} in '${dim.id}' is ${
				value ? "§aTRUE" : "§cFALSE"
			}`,
		);
	},
	{
		namespaces: ["scpdy"],
	},
);
