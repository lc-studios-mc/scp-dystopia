import * as mc from "@minecraft/server";

mc.system.beforeEvents.startup.subscribe((event) => {
	event.itemComponentRegistry.registerCustomComponent("scpdy:deal_max_damage_on_hit", {
		onHitEntity(arg) {
			try {
				const maxHealth = arg.hitEntity.getComponent("health")?.effectiveMax;

				arg.hitEntity.applyDamage(maxHealth ?? 99999999, {
					cause: mc.EntityDamageCause.override,
				});
			} catch {}
		},
	});
});
