import { AdvancedItem, AdvancedItemBaseConstructorArgs } from "@logic/advancedItem/AdvancedItem";
import { registerAdvancedItemProfile } from "@logic/advancedItem/profileRegistry";
import * as mc from "@minecraft/server";

registerAdvancedItemProfile({
	itemTypeId: "lc:scpdy_slasher",
	createInstance: (args) => new Slasher(args),
});

class Slasher extends AdvancedItem {
	private currentState: SlasherState;

	constructor(args: AdvancedItemBaseConstructorArgs) {
		super(args);
		args.player.startItemCooldown("scpdy_slasher_pick", 2);

		this.currentState = new IdleState(this);
	}

	transitionTo(newState: SlasherState): void {
		this.currentState.onExit();
		this.currentState = newState;
		this.currentState.onEnter();
	}

	onTick(mainhandItemStack: mc.ItemStack): void {
		this.currentState.onTick(mainhandItemStack);
	}

	onRemove(): void {}

	isUsable(event: mc.ItemStartUseAfterEvent): boolean {
		return this.currentState.isUsable(event);
	}

	onStartUse(event: mc.ItemStartUseAfterEvent): void {
		this.currentState.onStartUse(event);
	}

	onStopUse(event: mc.ItemStopUseAfterEvent): void {
		this.currentState.onStopUse(event);
	}

	onSwingArm(): void {
		this.currentState.onSwingArm();
	}

	onHitEntity(event: mc.EntityHitEntityAfterEvent): void {
		this.currentState.onHitEntity(event);
	}

	onHitBlock(event: mc.EntityHitBlockAfterEvent): void {
		this.currentState.onHitBlock(event);
	}
}

abstract class SlasherState {
	protected readonly slasher: Slasher;
	private _currentTick = -1;

	constructor(slasher: Slasher) {
		this.slasher = slasher;
	}

	get currentTick(): number {
		return this._currentTick;
	}

	// Lifetime methods
	onEnter(): void {}
	onExit(): void {}
	onTick(mainhandItemStack: mc.ItemStack): void {
		this._currentTick++;
	}

	// Event handlers
	isUsable(event: mc.ItemStartUseAfterEvent): boolean {
		return true;
	}
	onStartUse(event: mc.ItemStartUseAfterEvent): void {}
	onStopUse(event: mc.ItemStopUseAfterEvent): void {}
	onSwingArm(): void {}
	onHitEntity(event: mc.EntityHitEntityAfterEvent): void {}
	onHitBlock(event: mc.EntityHitBlockAfterEvent): void {}
}

class IdleState extends SlasherState {
}
