import * as mc from "@minecraft/server";
import * as vec3 from "@lib/utils/vec3";

export const MAX_PWR_AVAILABLE_RADIUS = 10;

export const PWR_NODE_ENTITY_TYPE = "lc:scpdy_pwr_node";
export const PWR_SRC_ENTITY_TYPE = "lc:scpdy_pwr_src";

const PWR_SENDER_QUERY_OPTS: mc.EntityQueryOptions = {
	closest: 1,
	maxDistance: MAX_PWR_AVAILABLE_RADIUS,
	families: ["pwr_sender"],
};

export function isPwrSrc(entity: mc.Entity): boolean {
	return entity.typeId === "lc:scpdy_pwr_src";
}

export function isPwrNode(entity: mc.Entity): boolean {
	return entity.typeId === "lc:scpdy_pwr_node";
}

export function isPowerAvailableAt(
	dimension: mc.Dimension,
	location: mc.Vector3,
	interactingPlayer?: mc.Player,
): boolean {
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
