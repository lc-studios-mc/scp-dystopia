import * as mc from "@minecraft/server";
import { showConfigEditorForm } from "@server/config/configData";

function onUse(arg: mc.ItemComponentUseEvent): void {
	const player = arg.source;

	if (player.hasTag("scpdy_world_leader") || player.isOp()) {
		showConfigEditorForm(player);
		return;
	}

	player.sendMessage({ translate: "scpdy.msg.config.restricted" });
	player.playSound("note.bass");
}

mc.world.beforeEvents.worldInitialize.subscribe((event) => {
	event.itemComponentRegistry.registerCustomComponent("scpdy:config_item", {
		onUse,
	});
});
