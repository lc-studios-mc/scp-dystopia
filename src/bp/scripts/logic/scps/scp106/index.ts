import * as mc from "@minecraft/server";
import { SCP106_ENTITY_TYPE_ID } from "./shared";

mc.system.afterEvents.scriptEventReceive.subscribe(event => {
	if (event.id !== "scpdy_scp106:update") return;
	if (!event.sourceEntity) return;
	if (event.sourceEntity.typeId !== SCP106_ENTITY_TYPE_ID) return;
	if (!event.sourceEntity.isValid) return;

	onUpdate(event.sourceEntity);
}, {
	namespaces: ["scpdy_scp106"],
});

function onUpdate(scp106: mc.Entity): void {
}
