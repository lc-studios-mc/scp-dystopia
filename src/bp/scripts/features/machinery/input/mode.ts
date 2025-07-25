export type MachineryInputMode = "powerRelayDoors" | "ctrlBlastDoor" | "placeRbBelow" | "placeRbBehind";

export function _getModeStringFromIndex(index: number): MachineryInputMode {
	switch (index) {
		case 0:
			return "powerRelayDoors";
		case 1:
			return "ctrlBlastDoor";
		case 2:
			return "placeRbBelow";
		case 3:
			return "placeRbBehind";
		default:
			throw new Error(`Unknown index: ${index}`);
	}
}

export function _isModeString(value: unknown): value is MachineryInputMode {
	switch (value) {
		case "powerRelayDoors":
		case "ctrlBlastDoor":
		case "placeRbBelow":
		case "placeRbBehind":
			return true;
		default:
			return false;
	}
}
