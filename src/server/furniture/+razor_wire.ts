import * as mc from "@minecraft/server";

function onStepOn(arg: mc.BlockComponentStepOnEvent): void {
  const { block, dimension, entity } = arg;

  if (!entity) return;
  if (entity instanceof mc.Player && entity.getGameMode() === mc.GameMode.creative) return;

  try {
    const result = entity.applyDamage(2, {
      cause: mc.EntityDamageCause.contact,
    });

    if (result) {
      entity.addEffect("slowness", 40);
      entity.teleport(entity.location);
      dimension.playSound("block.sweet_berry_bush.hurt", block.center());
    }
  } catch {}
}

function onStepOff(arg: mc.BlockComponentStepOnEvent): void {
  const { entity } = arg;

  if (!entity) return;
  if (entity instanceof mc.Player && entity.getGameMode() === mc.GameMode.creative) return;

  try {
    entity.applyDamage(1, {
      cause: mc.EntityDamageCause.override,
    });
  } catch {}
}

mc.world.beforeEvents.worldInitialize.subscribe((event) => {
  event.blockComponentRegistry.registerCustomComponent("scpdy:razor_wire", {
    onStepOn,
    onStepOff,
  });
});
