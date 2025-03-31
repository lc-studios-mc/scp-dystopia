import { getModifiedDamageNumber } from "@lib/utils/entityUtils";
import * as vec3 from "@lib/utils/vec3";
import { AdvancedItem, AdvancedItemBaseConstructorArgs } from "@logic/advancedItem/AdvancedItem";
import { registerAdvancedItemProfile } from "@logic/advancedItem/profileRegistry";
import * as mc from "@minecraft/server";
import * as beam from "./beam";

function shakeCamera(
	player: mc.Player,
	intensity: number,
	seconds: number,
	shakeType: "positional" | "rotational" = "rotational",
): void {
	player.runCommand(
		`camerashake add @s ${intensity.toFixed(2)} ${seconds.toFixed(2)} ${shakeType}`,
	);
}

const isPlayerImmune = (player: mc.Player): boolean =>
	[mc.GameMode.creative, mc.GameMode.spectator].includes(player.getGameMode());

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

	getHeadFrontLocation(): mc.Vector3 {
		return vec3.add(this.player.getHeadLocation(), this.player.getViewDirection());
	}

	playSoundAtHeadFront(soundId: string, opts?: mc.WorldSoundOptions): void {
		this.player.dimension.playSound(soundId, this.getHeadFrontLocation(), opts);
	}

	playSound3DAnd2D(soundId: string, maxDist = 15, opts?: mc.PlayerSoundOptions): void {
		const soundId2D = `${soundId}.2d`;
		this.player.playSound(soundId2D, opts);

		const listeners = this.player.dimension.getPlayers({
			location: this.player.getHeadLocation(),
			maxDistance: maxDist,
		});

		for (const listener of listeners) {
			if (listener === this.player) continue;

			listener.playSound(soundId, {
				location: this.player.getHeadLocation(),
				pitch: opts?.pitch,
				volume: opts?.volume,
			});
		}
	}

	getCooldown(id: string): number {
		return this.player.getItemCooldown(id);
	}

	setCooldown(id: string, duration = 2): void {
		this.player.startItemCooldown(id, duration);
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
	onTick(mainhandItemStack: mc.ItemStack): void {
		super.onTick(mainhandItemStack);

		if (!this.slasher.isBeingUsed) return;

		this.slasher.transitionTo(new ChargingState(this.slasher));
	}

	onSwingArm(): void {
		this.slasher.transitionTo(new SwingAttackState(this.slasher));
	}
}

class SwingAttackState extends SlasherState {
	private static readonly DAMAGE = 2;
	private static readonly COOLDOWN = 3;
	private static readonly STATE_LIFESPAN = 10;

	private ticksUntilExitState = SwingAttackState.STATE_LIFESPAN;
	private cooldown = 0;
	private isNextSwingQueued = false;
	private nextAnimIndex = 0;

	onTick(mainhandItemStack: mc.ItemStack): void {
		super.onTick(mainhandItemStack);

		if (this.ticksUntilExitState <= 0) {
			this.slasher.transitionTo(new IdleState(this.slasher));
			return;
		}

		this.ticksUntilExitState--;

		if (this.cooldown > 0) this.cooldown--;
		else if (this.cooldown <= 0 && this.isNextSwingQueued) {
			this.isNextSwingQueued = false;
			this.swingAttack();
		}
	}

	onEnter(): void {
		this.swingAttack();
	}

	onSwingArm(): void {
		if (this.cooldown > 0) {
			this.isNextSwingQueued = true;
			return;
		}

		this.swingAttack();
	}

	private swingAttack(): void {
		this.ticksUntilExitState = SwingAttackState.STATE_LIFESPAN;
		this.cooldown += SwingAttackState.COOLDOWN;

		this.slasher.playSoundAtHeadFront("scpdy.slasher.swing", { volume: 1.1 });

		const animSwingCd1 = `scpdy_slasher_swing_cd_1`;
		const animSwingCd2 = `scpdy_slasher_swing_cd_2`;

		if (this.nextAnimIndex === 0) {
			this.slasher.setCooldown(animSwingCd1, 10);
			this.slasher.setCooldown(animSwingCd2, 0);

			this.nextAnimIndex = 1;
		} else {
			this.slasher.setCooldown(animSwingCd2, 10);
			this.slasher.setCooldown(animSwingCd1, 0);

			this.nextAnimIndex = 0;
		}

		shakeCamera(this.slasher.player, 0.05, 0.09);

		this.shootBeams();

		mc.system.run(() => {
			this.simulateSwingDamage();
		});
	}

	private shootBeams(): void {
		beam.shootSlasherSwingBeam(this.slasher.player, -1);
		beam.shootSlasherSwingBeam(this.slasher.player, 0);
		beam.shootSlasherSwingBeam(this.slasher.player, 1);
	}

	private simulateSwingDamage(): void {
		const entities = this.slasher.player.dimension.getEntities({
			closest: 10,
			maxDistance: 2.2,
			location: this.slasher.getHeadFrontLocation(),
		});

		for (let i = 0; i < entities.length; i++) {
			const entity = entities[i]!;
			if (entity === this.slasher.player) continue;
			if (entity instanceof mc.Player) {
				if (!mc.world.gameRules.pvp) continue;
				if (isPlayerImmune(entity)) continue;
			}

			const damage = Math.max(1, getModifiedDamageNumber(SwingAttackState.DAMAGE, entity));

			entity.applyDamage(damage, {
				cause: mc.EntityDamageCause.override,
				damagingEntity: this.slasher.player,
			});
		}
	}
}

class ChargingState extends SlasherState {
	private static readonly FULL_CHARGE_DURATION = 5;

	onTick(mainhandItemStack: mc.ItemStack): void {
		super.onTick(mainhandItemStack);

		const chargeUIMap = [
			"§c>     X     <",
			"§c>    X    <",
			"§c>   X   <",
			"§c>  X  <",
			"§c> X <",
			"§c>X<",
		];

		if (this.currentTick < ChargingState.FULL_CHARGE_DURATION) {
			this.slasher.player.onScreenDisplay.setActionBar(chargeUIMap[this.currentTick]);
		} else {
			// Flashy colors for fully charged
			this.slasher.player.onScreenDisplay.setActionBar(
				this.currentTick % 2 === 0 ? "§e>X<" : "§b>X<",
			);
		}

		if (this.currentTick === 0) {
			this.slasher.setCooldown("scpdy_slasher_charge_start_cd");
			this.slasher.player.playAnimation("animation.scpdy_player.slasher.charge_start");
		}

		if (this.currentTick > 0 && this.currentTick % 6 === 0) {
			this.slasher.player.playAnimation("animation.scpdy_player.slasher.charge_hold");
		}

		if (this.currentTick % 8 === 0) {
			this.slasher.playSoundAtHeadFront("scpdy.slasher.charge_loop");
		}
	}

	onStopUse(_event: mc.ItemStopUseAfterEvent): void {
		if (this.currentTick < ChargingState.FULL_CHARGE_DURATION) this.cancelCharge();
		else this.releaseFullCharge();
	}

	private cancelCharge(): void {
		this.slasher.setCooldown("scpdy_slasher_charge_cancel_cd");
		this.slasher.transitionTo(new IdleState(this.slasher));

		this.slasher.player.onScreenDisplay.setActionBar("§8---");
	}

	private releaseFullCharge(): void {
		const plunge = !this.slasher.player.isOnGround && this.slasher.player.getRotation().x > 83 &&
			this.slasher.player.inputInfo.getButtonState(mc.InputButton.Jump) === mc.ButtonState.Pressed;

		if (plunge) {
			// TODO: Transition to plunging state
			return;
		}

		this.slasher.transitionTo(new SlashingState(this.slasher));
	}
}

class SlashingState extends SlasherState {
}
