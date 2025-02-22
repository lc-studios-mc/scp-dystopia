import * as mc from "@minecraft/server";
import { AdvancedItem } from "@server/advancedItem/AdvancedItem";
import { registerAdvancedItemProfile } from "@server/advancedItem/profileRegistry";

registerAdvancedItemProfile({
	itemTypeId: "lc:scpdy_pwrline_tool",
	createInstance: (args) => new PowerlineTool(args),
});

class PowerlineTool extends AdvancedItem {
	override onTick(mainhandItemStack: mc.ItemStack): void {}

	override onRemove(): void {}

	override isUsable(event: mc.ItemStartUseAfterEvent): boolean {
		return true;
	}

	override onStartUse(event: mc.ItemStartUseAfterEvent): void {}

	override onStopUse(event: mc.ItemStopUseAfterEvent): void {}

	override onSwingArm(): void {}

	override onHitEntity(event: mc.EntityHitEntityAfterEvent): void {}

	override onHitBlock(event: mc.EntityHitBlockAfterEvent): void {}
}
