import * as mc from "@minecraft/server";
import { AdvancedItem, AdvancedItemBaseConstructorArgs } from "@server/advancedItem/AdvancedItem";
import { registerAdvancedItemProfile } from "@server/advancedItem/profileRegistry";
import {
  AmmoType,
  AmmoTypeInfo,
  getAmmoItemType,
  getAmmoType,
  getAmmoTypeInfo,
  removeAmmo,
} from "./ammo";

class AmmoPack extends AdvancedItem {
  private static readonly neededUseTick = 10;
  private playerContainer: mc.Container;
  private ammoType: AmmoType;
  private ammoTypeInfo: AmmoTypeInfo;
  private useTick = -1;

  constructor(args: AdvancedItemBaseConstructorArgs) {
    super(args);

    this.playerContainer = args.player.getComponent("inventory")!.container!;

    const item = args.playerMainhand.getItem()!;

    this.ammoType = getAmmoType(item)!;
    this.ammoTypeInfo = getAmmoTypeInfo(this.ammoType);
  }

  onTick(mainhandItemStack: mc.ItemStack): void {
    if (this.useTick === -1) return;

    if (this.player.getItemCooldown("scpdy_ammo_pack_usage") > 0) return;

    if (this.useTick <= AmmoPack.neededUseTick) {
      const actionbarStringHyphenArray: string[] = [];
      const loopCount = AmmoPack.neededUseTick - this.useTick;

      for (let i = 0; i < loopCount; i++) {
        actionbarStringHyphenArray.push("-");
      }

      const actionbarStringHyphens = actionbarStringHyphenArray.join("");
      const actionbarString = actionbarStringHyphens + "+" + actionbarStringHyphens;

      this.player.onScreenDisplay.setActionBar(`§7${actionbarString}`);
      this.useTick++;
      return;
    }

    this.useTick = 0;

    const durabilityComponent = mainhandItemStack.getComponent("durability")!;

    if (!durabilityComponent)
      throw new Error(`Durability component of ${mainhandItemStack.typeId} is missing.`);

    this.player.startItemCooldown("scpdy_ammo_pack_usage", 5);

    const mode: "putAmmo" | "extractAmmo" = this.player.isSneaking ? "extractAmmo" : "putAmmo";

    if (mode === "putAmmo") {
      if (durabilityComponent.damage <= 0) {
        this.player.onScreenDisplay.setActionBar({
          translate: "scpdy.actionHint.ammoPack.full",
        });
        return;
      }

      const maxPutAmount = Math.min(64, durabilityComponent.damage);

      const putAmount = removeAmmo(this.playerContainer, this.ammoType, maxPutAmount, true);

      if (putAmount <= 0) {
        this.player.onScreenDisplay.setActionBar({
          translate: "scpdy.actionHint.ammoPack.noAmmoInInventory",
        });
        return;
      }

      durabilityComponent.damage -= putAmount;

      const currentLoad = durabilityComponent.maxDurability - durabilityComponent.damage;
      const textColor = durabilityComponent.damage <= 0 ? `§a` : `§f`;
      const displayText = `${textColor}${currentLoad} / ${durabilityComponent.maxDurability}`;

      this.player.onScreenDisplay.setActionBar(displayText);

      this.playerMainhand.setItem(mainhandItemStack);

      this.player.dimension.playSound(
        "scpdy.gun.ammo_pack.load_ammo",
        this.player.getHeadLocation(),
      );
    } else if (mode === "extractAmmo") {
      const extractAmount = Math.min(
        64,
        durabilityComponent.maxDurability - durabilityComponent.damage,
      );

      if (extractAmount <= 0) {
        this.player.onScreenDisplay.setActionBar({ translate: "scpdy.actionHint.ammoPack.empty" });
        return;
      }

      durabilityComponent.damage += extractAmount;

      this.playerMainhand.setItem(mainhandItemStack);

      const dropAmmoItemStack = new mc.ItemStack(getAmmoItemType(this.ammoType), extractAmount);

      mc.system.runTimeout(() => {
        this.player.dimension.spawnItem(dropAmmoItemStack, this.player.getHeadLocation());
      }, 1);
    }
  }

  onRemove(): void {}

  canBeUsed(): boolean {
    return true;
  }

  onStartUse(event: mc.ItemStartUseAfterEvent): void {
    this.useTick = 0;
  }

  onStopUse(event: mc.ItemStopUseAfterEvent): void {
    this.useTick = -1;
  }

  onSwingArm(): void {}

  onHitEntity(event: mc.EntityHitEntityAfterEvent): void {}

  onHitBlock(event: mc.EntityHitBlockAfterEvent): void {}
}

const AMMO_PACK_ITEM_TYPES: string[] = [
  "lc:scpdy_ammo_pack_9mm",
  "lc:scpdy_ammo_pack_12shell",
  "lc:scpdy_ammo_pack_50bmg",
  "lc:scpdy_ammo_pack_338magnum",
  "lc:scpdy_ammo_pack_556mm",
  "lc:scpdy_ammo_pack_762x51",
];

for (const ammoPackItemType of AMMO_PACK_ITEM_TYPES) {
  registerAdvancedItemProfile({
    itemTypeId: ammoPackItemType,
    createInstance: (args) => new AmmoPack(args),
  });
}
