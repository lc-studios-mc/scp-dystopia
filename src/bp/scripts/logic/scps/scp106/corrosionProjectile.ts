import * as mc from "@minecraft/server";
import { SCP106_ENTITY_TYPE_ID } from "./shared";

const CORROSION_PROJECTILE_ENTITY_TYPE_ID = "lc:scpdy_corrosion_projectile";

mc.world.afterEvents.dataDrivenEntityTrigger.subscribe(
	({ entity }) => {
		explode(entity);
	},
	{
		entityTypes: [CORROSION_PROJECTILE_ENTITY_TYPE_ID],
		eventTypes: ["bom"],
	},
);

mc.world.afterEvents.projectileHitEntity.subscribe((event) => {
	if (event.projectile.typeId !== CORROSION_PROJECTILE_ENTITY_TYPE_ID) return;
	explode(event.projectile, event.getEntityHit().entity, event.source);
});

mc.world.afterEvents.projectileHitBlock.subscribe((event) => {
	if (event.projectile.typeId !== CORROSION_PROJECTILE_ENTITY_TYPE_ID) return;
	explode(event.projectile);
});

function explode(projectile: mc.Entity, hitEntity?: mc.Entity, source?: mc.Entity): void {
	try {
		projectile.dimension.spawnParticle("lc:scpdy_corrosion_burst_emitter", projectile.location);

		try {
			const damage = mc.world.getDifficulty() === mc.Difficulty.Hard ? 9 : 6;

			hitEntity?.applyDamage(damage, {
				cause: mc.EntityDamageCause.override,
				damagingProjectile: projectile,
				damagingEntity: source,
			});

			hitEntity?.addEffect("slowness", 180, { amplifier: 0 });
		} catch {}

		const entities = projectile.dimension.getEntities({
			closest: 10,
			location: projectile.location,
			maxDistance: 2.4,
			excludeTypes: [SCP106_ENTITY_TYPE_ID, CORROSION_PROJECTILE_ENTITY_TYPE_ID],
		});

		for (let i = 0; i < entities.length; i++) {
			const entity = entities[i]!;

			try {
				entity.addEffect("wither", 100, { amplifier: 1 });
			} catch {}
		}
	} finally {
		projectile.remove();
	}
}
