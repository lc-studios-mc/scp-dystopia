import * as mc from "@minecraft/server";
import * as vec3 from "@lib/utils/vec3";
import { SCP106_ENTITY_TYPE_ID, SCP106_STATE } from "./shared";

mc.system.afterEvents.scriptEventReceive.subscribe(
	(event) => {
		if (!event.sourceEntity) return;
		if (!event.sourceEntity.isValid) return;
		if (event.sourceEntity.typeId !== SCP106_ENTITY_TYPE_ID) return;

		const scp106 = event.sourceEntity;

		switch (event.id) {
			case "scpdy_scp106:update":
				onUpdate(scp106);
				break;
		}
	},
	{
		namespaces: ["scpdy_scp106"],
	},
);

function onUpdate(scp106: mc.Entity): void {}
