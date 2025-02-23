import * as mc from "@minecraft/server";
import * as vec3 from "@lib/utils/vec3";
import { getReceiverNodes, getTransmitter, isPowered } from "./shared";

export async function visualizePwrline(
	player: mc.Player,
	pwrSrcOrNode: mc.Entity,
	dontShowTransmission = false,
	recursive = 0,
): Promise<void> {
	const srcLoc = vec3.add(pwrSrcOrNode.location, { x: 0, y: 0.5, z: 0 });

	const transmitter = getTransmitter(pwrSrcOrNode);

	if (!dontShowTransmission && transmitter) {
		// From transmitter src/node

		const particleId = isPowered(transmitter)
			? "lc:scpdy_pwrline_indicator_particle"
			: "lc:scpdy_pwrline_indicator_off_particle";

		const transmitterLoc = vec3.add(transmitter.location, { x: 0, y: 0.5, z: 0 });
		const density = Math.floor(vec3.distance(srcLoc, transmitterLoc));
		const points = calculateDistributedPoints(srcLoc, transmitterLoc, density).reverse();
		const waitHappenIter = Math.max(5, Math.floor(density / 5));

		for (let i = 0; i < points.length; i++) {
			const point = points[i]!;

			player.spawnParticle(particleId, point);

			if (i % waitHappenIter === 0) await mc.system.waitTicks(1);
		}
	}

	const receivers = getReceiverNodes(pwrSrcOrNode, false);

	const particleId = isPowered(pwrSrcOrNode)
		? "lc:scpdy_pwrline_indicator_particle"
		: "lc:scpdy_pwrline_indicator_off_particle";

	for (let i = 0; i < receivers.length; i++) {
		const receiver = receivers[i]!;

		const receiverLoc = vec3.add(receiver.location, { x: 0, y: 0.5, z: 0 });
		const density = Math.floor(vec3.distance(srcLoc, receiverLoc));
		const points = calculateDistributedPoints(srcLoc, receiverLoc, density);
		const waitHappenIter = Math.max(5, Math.floor(density / 5));

		for (let i = 0; i < points.length; i++) {
			const point = points[i]!;

			player.spawnParticle(particleId, point);

			if (i % waitHappenIter === 0) await mc.system.waitTicks(1);
		}
	}

	if (recursive > 0) {
		visualizePwrline(player, pwrSrcOrNode, true, recursive - 1);
	}
}

export async function visualizeNewPwrline(
	player: mc.Player,
	pwrSrcOrNode: mc.Entity,
	to: mc.Vector3,
): Promise<void> {
	const srcLoc = vec3.add(pwrSrcOrNode.location, { x: 0, y: 0.5, z: 0 });
	const density = Math.floor(vec3.distance(srcLoc, to));
	const points = calculateDistributedPoints(srcLoc, to, density);

	for (const point of points) {
		player.spawnParticle("lc:scpdy_new_pwrline_indicator_particle", point);
	}
}

function calculateDistributedPoints(
	pointA: mc.Vector3,
	pointB: mc.Vector3,
	numPoints: number = 5,
): mc.Vector3[] {
	// Create array to store intermediate points
	const points: mc.Vector3[] = [];

	// Calculate the difference vector between points
	const deltaX = pointB.x - pointA.x;
	const deltaY = pointB.y - pointA.y;
	const deltaZ = pointB.z - pointA.z;

	// Generate only the intermediate points
	// We start at 1 and end at numPoints to exclude start and end points
	for (let i = 1; i <= numPoints; i++) {
		// Calculate the interpolation factor between 0 and 1
		const t = i / (numPoints + 1);

		// Create new point using linear interpolation
		const point: mc.Vector3 = {
			x: pointA.x + deltaX * t,
			y: pointA.y + deltaY * t,
			z: pointA.z + deltaZ * t,
		};

		points.push(point);
	}

	return points;
}
