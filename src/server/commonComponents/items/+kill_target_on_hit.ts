import * as mc from "@minecraft/server";

function onHitEntity(arg: mc.ItemComponentHitEntityEvent): void {
  try {
    arg.hitEntity.kill();
  } catch {}
}

mc.world.beforeEvents.worldInitialize.subscribe((event) => {
  event.itemComponentRegistry.registerCustomComponent("scpdy:kill_target_on_hit", {
    onHitEntity,
  });
});
