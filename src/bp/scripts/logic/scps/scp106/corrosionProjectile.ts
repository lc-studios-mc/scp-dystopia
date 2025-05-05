import * as mc from "@minecraft/server";

mc.world.afterEvents.dataDrivenEntityTrigger.subscribe(
	({ entity }) => {
		try {
			explode(entity);
		} catch {}
	},
	{
		entityTypes: ["lc:scpdy_corrosion_projectile"],
		eventTypes: ["bom"],
	},
);

function explode(projectile: mc.Entity): void {
	mc.world.sendMessage("eh");
	projectile.dimension.spawnParticle("lc:scpdy_corrosion_burst_emitter", projectile.location);
	projectile.remove();
}
