export const SCP106_ENTITY_TYPE_ID = "lc:scpdy_scp106";

export const SCP106_STATE = {
	default: 0,
	diving: 10,
	hidden: 20,
	appearingSlow: 30,
	appearingFast: 40,
	throwingRight: 50,
	throwingLeft: 60,
	retreating: 70,
} as const;
