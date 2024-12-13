import * as mc from "@minecraft/server";
import * as vec3 from "@lib/utils/vec3";

function onTick(arg: mc.BlockComponentTickEvent): void {
  const ticksUntilActiveAgain = arg.block.permutation.getState(
    "lc:ticks_until_active_again",
  ) as number;

  if (ticksUntilActiveAgain <= 0) return;

  arg.block.setPermutation(
    arg.block.permutation.withState("lc:ticks_until_active_again", ticksUntilActiveAgain - 1),
  );
}

function onStepOn(arg: mc.BlockComponentStepOnEvent): void {
  if (!arg.entity) return;
  if (!(arg.entity instanceof mc.Player)) return;

  const ticksUntilActiveAgain = arg.block.permutation.getState(
    "lc:ticks_until_active_again",
  ) as number;

  if (ticksUntilActiveAgain > 0) return;

  let dashDir = arg.entity.getVelocity();
  dashDir.y = 0;
  vec3.normalize(dashDir);

  arg.entity.applyKnockback(dashDir.x, dashDir.z, 3, 0);

  arg.entity.addEffect("speed", 50, {
    amplifier: 1,
  });

  arg.block.setPermutation(arg.block.permutation.withState("lc:ticks_until_active_again", 15));
}

mc.world.beforeEvents.worldInitialize.subscribe((event) => {
  event.blockComponentRegistry.registerCustomComponent("scpdy:dash_block", {
    onTick,
    onStepOn,
  });
});
