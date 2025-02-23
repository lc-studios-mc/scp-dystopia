import * as mc from "@minecraft/server";
import * as vec3 from "@lib/utils/vec3";
import { AdvancedItem } from "@server/advancedItem/AdvancedItem";
import { registerAdvancedItemProfile } from "@server/advancedItem/profileRegistry";
import { getEntityName } from "@lib/utils/entityUtils";
import { getRelativeBlock } from "@lib/utils/blockUtils";
import {
	getReceiverNodes,
	getTransmitter,
	isPowered,
	isPwrNode,
	isPwrSrc,
	PWR_NODE_ENTITY_TYPE,
	setReceiverNodes,
	setTransmitter,
} from "./shared";
import { visualizeNewPwrline, visualizePwrline } from "./helperParticles";

type ConnectTo =
	| {
			to: "existing";
			entity: mc.Entity;
	  }
	| {
			to: "newNode";
			at: mc.Vector3;
	  };

const SELECTED_TRANSMITTER_PROP_ID = "selectedTransmitter";

registerAdvancedItemProfile({
	itemTypeId: "lc:scpdy_pwrline_tool",
	createInstance: (args) => new PowerlineTool(args),
});

class PowerlineTool extends AdvancedItem {
	private _pwrSrcOrNodeInView?: mc.Entity;
	private _actionbarUpdateCooldown = 0;
	private _pwrlineParticleCooldown = 0;
	private _pwrRadiusSphereCooldown = 0;
	private _connectTo?: ConnectTo;

	override onTick(mainhandItemStack: mc.ItemStack): void {
		this.onTick_1();

		if (this._actionbarUpdateCooldown > 0) this._actionbarUpdateCooldown--;
		if (this._pwrlineParticleCooldown > 0) this._pwrlineParticleCooldown--;
		if (this._pwrRadiusSphereCooldown > 0) this._pwrRadiusSphereCooldown--;
	}

	private onTick_1(): void {
		this._pwrSrcOrNodeInView;

		const raycastHits = this.player.getEntitiesFromViewDirection({
			families: ["pwr_src_or_node"],
			maxDistance: 32,
		});

		this._pwrSrcOrNodeInView = raycastHits[0]?.entity;

		const transmitter = this.getSelectedTransmitter();

		if (!transmitter) {
			if (this._pwrSrcOrNodeInView) {
				this.updateActionbar({
					translate: "scpdy.actionHint.pwrgrid.pwrlineTool.useToSelectTransmitter",
				});

				try {
					const entity = this._pwrSrcOrNodeInView;
					mc.system.run(() => {
						if (this._pwrlineParticleCooldown <= 0) {
							visualizePwrline(this.player, entity, false, 2);
							this._pwrlineParticleCooldown = 20;
						}

						if (this._pwrRadiusSphereCooldown <= 0 && isPowered(entity)) {
							const loc = vec3.add(entity.location, { x: 0, y: 0.5, z: 0 });
							entity.dimension.spawnEntity("lc:scpdy_pwr_radius_sphere", loc);
							this._pwrRadiusSphereCooldown = 20;
						}
					});
				} catch {}
			} else {
				this.updateActionbar({
					translate: "scpdy.actionHint.pwrgrid.pwrlineTool.lookAtTransmitter",
				});
			}

			return;
		}

		const lastPreviewLoc = this._connectTo?.to === "newNode" ? this._connectTo.at : vec3.ZERO;
		this._connectTo = undefined;

		if (this._pwrSrcOrNodeInView) {
			if (!isPwrNode(this._pwrSrcOrNodeInView)) {
				this.updateActionbar({
					translate: "scpdy.actionHint.pwrgrid.pwrlineTool.cannotConnectToPwrSrc",
					with: {
						rawtext: [getEntityName(this._pwrSrcOrNodeInView)],
					},
				});
				return;
			}

			if (vec3.distance(transmitter.location, this._pwrSrcOrNodeInView.location) > 32) {
				this.updateActionbar({
					translate: "scpdy.actionHint.pwrgrid.pwrlineTool.tooFarFromTransmitter",
				});
				return;
			}

			if (this._pwrSrcOrNodeInView === transmitter) {
				this.updateActionbar({
					translate: "scpdy.actionHint.pwrgrid.pwrlineTool.useItemToCancel",
				});

				// Don't return!
			} else {
				this.updateActionbar({
					translate: "scpdy.actionHint.pwrgrid.pwrlineTool.willConnectToExisting",
					with: {
						rawtext: [getEntityName(this._pwrSrcOrNodeInView)],
					},
				});
			}

			this._connectTo = {
				to: "existing",
				entity: this._pwrSrcOrNodeInView,
			};

			try {
				const loc = vec3.add(this._connectTo.entity.location, { x: 0, y: 0.5, z: 0 });
				mc.system.run(() => {
					if (this._pwrlineParticleCooldown <= 0) {
						visualizeNewPwrline(this.player, transmitter, loc);
						this._pwrlineParticleCooldown = 6;
					}

					if (this._pwrRadiusSphereCooldown <= 0 && isPowered(transmitter)) {
						transmitter.dimension.spawnEntity("lc:scpdy_pwr_radius_sphere", loc);
						this._pwrRadiusSphereCooldown = 20;
					}
				});
			} catch {}

			return;
		}

		let newPowerNodeLocation: mc.Vector3 | undefined;

		const blockRaycastHit = this.player.getBlockFromViewDirection({
			maxDistance: 64,
		});

		if (blockRaycastHit)
			newPowerNodeLocation = getRelativeBlock(
				blockRaycastHit.block,
				blockRaycastHit.face,
			)?.bottomCenter();

		if (!newPowerNodeLocation) {
			const loc = vec3
				.chain(vec3.FORWARD)
				.mul(32)
				.changeDir(this.player.getViewDirection())
				.add(this.player.getHeadLocation())
				.done();

			newPowerNodeLocation = vec3.add(vec3.floor(loc), { x: 0.5, y: 0.0, z: 0.5 });
		}

		if (vec3.distance(transmitter.location, newPowerNodeLocation) > 32) {
			this.updateActionbar({
				translate: "scpdy.actionHint.pwrgrid.pwrlineTool.tooFarFromTransmitter",
			});
			return;
		}

		this.updateActionbar({
			translate: "scpdy.actionHint.pwrgrid.pwrlineTool.willConnectToNewNode",
			with: [vec3.toString(vec3.floor(newPowerNodeLocation))],
		});

		this.player.spawnParticle("lc:scpdy_pwr_node_preview_particle", newPowerNodeLocation);

		if (vec3.distance(lastPreviewLoc, newPowerNodeLocation) > 0.5)
			this.player.playSound("random.pop", {
				location: lastPreviewLoc,
				volume: 0.9,
				pitch: 1.3,
			});

		this._connectTo = {
			to: "newNode",
			at: newPowerNodeLocation,
		};

		try {
			const loc = vec3.add(this._connectTo.at, { x: 0, y: 0.5, z: 0 });
			mc.system.run(() => {
				if (this._pwrlineParticleCooldown <= 0) {
					visualizeNewPwrline(this.player, transmitter, loc);
					this._pwrlineParticleCooldown = 6;
				}

				if (this._pwrRadiusSphereCooldown <= 0 && isPowered(transmitter)) {
					const loc = vec3.add(transmitter.location, { x: 0, y: 0.5, z: 0 });
					transmitter.dimension.spawnEntity("lc:scpdy_pwr_radius_sphere", loc);
					this._pwrRadiusSphereCooldown = 20;
				}
			});
		} catch {}
	}

	override onRemove(): void {}

	override isUsable(event: mc.ItemStartUseAfterEvent): boolean {
		return true;
	}

	override onStartUse(event: mc.ItemStartUseAfterEvent): void {
		const transmitter = this.getSelectedTransmitter();

		if (!transmitter) {
			if (!this._pwrSrcOrNodeInView) return;

			if (getReceiverNodes(this._pwrSrcOrNodeInView).length >= 5) {
				this.updateActionbar(
					{
						translate: "scpdy.actionHint.pwrgrid.pwrlineTool.cannotAddReceivers",
					},
					true,
				);
				this._actionbarUpdateCooldown = 15;
				this.player.playSound("note.bass");
				return;
			}

			this.setSelectedTransmitter(this._pwrSrcOrNodeInView);
			this.updateActionbar(
				{
					translate: "scpdy.actionHint.pwrgrid.pwrlineTool.selectedTransmitter",
				},
				true,
			);
			this._actionbarUpdateCooldown = 15;
			this._pwrlineParticleCooldown = 0;

			this.player.playSound("note.hat");

			return;
		}

		if (this.player.inputInfo.getButtonState(mc.InputButton.Sneak) === mc.ButtonState.Pressed) {
			this.setSelectedTransmitter(undefined);
			this.player.playSound("random.hurt");

			this.updateActionbar(
				{
					translate: "scpdy.actionHint.pwrgrid.pwrlineTool.canceled",
				},
				true,
			);
			this._actionbarUpdateCooldown = 15;

			return;
		}

		if (!this._connectTo) return;

		if (this._connectTo.to === "existing") {
			if (this._connectTo.entity === transmitter) {
				this.setSelectedTransmitter(undefined);
				this.player.playSound("random.hurt");

				this.updateActionbar(
					{
						translate: "scpdy.actionHint.pwrgrid.pwrlineTool.canceled",
					},
					true,
				);
				this._actionbarUpdateCooldown = 15;

				return;
			}

			if (getTransmitter(this._connectTo.entity)) {
				this.updateActionbar(
					{
						translate: "scpdy.actionHint.pwrgrid.pwrlineTool.theNodeAlreadyHasTransmitter",
					},
					true,
				);
				this._actionbarUpdateCooldown = 15;

				this.player.playSound("note.bass");

				return;
			}

			const nodeEntity = this._connectTo.entity;

			setTransmitter(this._connectTo.entity, transmitter);

			const receiversOfTransmitter = getReceiverNodes(transmitter);
			receiversOfTransmitter.push(nodeEntity);
			setReceiverNodes(transmitter, receiversOfTransmitter);
		} else if (this._connectTo.to === "newNode") {
			const nodeEntity = this.player.dimension.spawnEntity(
				PWR_NODE_ENTITY_TYPE,
				this._connectTo.at,
			);

			setTransmitter(nodeEntity, transmitter);

			const receiversOfTransmitter = getReceiverNodes(transmitter);
			receiversOfTransmitter.push(nodeEntity);
			setReceiverNodes(transmitter, receiversOfTransmitter);
		}

		this.updateActionbar(
			{
				translate: "scpdy.actionHint.pwrgrid.pwrlineTool.connected",
			},
			true,
		);
		this._actionbarUpdateCooldown = 30;

		this.player.playSound("random.orb");

		this.setSelectedTransmitter(undefined);
	}

	override onStopUse(event: mc.ItemStopUseAfterEvent): void {}

	override onSwingArm(): void {}

	override onHitEntity(event: mc.EntityHitEntityAfterEvent): void {}

	override onHitBlock(event: mc.EntityHitBlockAfterEvent): void {}

	private updateActionbar(text: string | mc.RawMessage, force = false): void {
		if (!force && this._actionbarUpdateCooldown > 0) return;
		this.player.onScreenDisplay.setActionBar(text);
	}

	private getSelectedTransmitter(removeInvalid = true): mc.Entity | undefined {
		const mainhandItemStack = this.playerMainhand.getItem();
		if (!mainhandItemStack) return;
		if (mainhandItemStack.typeId !== this.profile.itemTypeId) return;

		const id = mainhandItemStack.getDynamicProperty(SELECTED_TRANSMITTER_PROP_ID);
		if (typeof id !== "string") {
			if (removeInvalid) {
				mainhandItemStack.setDynamicProperty(SELECTED_TRANSMITTER_PROP_ID, undefined);
				this.playerMainhand.setItem(mainhandItemStack);
			}
			return;
		}

		const entity = mc.world.getEntity(id);

		if (!entity) {
			if (removeInvalid) {
				mainhandItemStack.setDynamicProperty(SELECTED_TRANSMITTER_PROP_ID, undefined);
				this.playerMainhand.setItem(mainhandItemStack);
			}
			return;
		}

		return entity;
	}

	private setSelectedTransmitter(value: mc.Entity | undefined): void {
		const mainhandItemStack = this.playerMainhand.getItem();
		if (!mainhandItemStack) return;
		if (mainhandItemStack.typeId !== this.profile.itemTypeId) return;

		mainhandItemStack.setDynamicProperty(SELECTED_TRANSMITTER_PROP_ID, value?.id);

		this.playerMainhand.setItem(mainhandItemStack);
	}
}
