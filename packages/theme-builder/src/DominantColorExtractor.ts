import { Color } from "@/utils/Color";

export class DominantColorExtractor {
  constructor() {}

  async getDominantColors(colors: Color[]) {
    const k = 8;

    const clusters = new Array(k)
      .fill(0)
      .map((_, i) => ({
        representative: Color.fromHSL((i * 360) / k, 0.5, 0.5),
        // representativeH: (i * 360) / k,
        members: <Color[]>[],
        mostScoringColor: <Color | null>null,
        totalScore: 0,
        scores: new Map<number, number>(),
      }))
      .concat([
        {
          representative: Color.fromHSL(0, 0, 0),
          // representativeH: (i * 360) / k,
          members: <Color[]>[],
          mostScoringColor: <Color | null>null,
          totalScore: 0,
          scores: new Map<number, number>(),
        },
        {
          representative: Color.fromHSL(0, 0, 1),
          // representativeH: (i * 360) / k,
          members: <Color[]>[],
          mostScoringColor: <Color | null>null,
          totalScore: 0,
          scores: new Map<number, number>(),
        },
      ]);

    for (const color of colors) {
      let closestCluster: (typeof clusters)[0] | null = null;
      let closestDistance = Infinity;

      for (const cluster of clusters) {
        const distance = (
          cluster.mostScoringColor ?? cluster.representative
        ).distanceCartesianTo(color, "hsl");

        if (distance < closestDistance) {
          closestDistance = distance;
          closestCluster = cluster;
        }
      }
      closestCluster = closestCluster!;

      const colorScore =
        color.getSaturation() ** 2 *
        (color.getLightness() > 0.15 && color.getLightness() < 0.85
          ? 1.5
          : 0.5);

      const packed = color.packRGB();

      const prevScore = closestCluster.scores.get(packed) ?? 0;
      const newScore = prevScore + colorScore;

      closestCluster.scores.set(packed, newScore);
      closestCluster.totalScore += colorScore;
      if (
        !closestCluster.mostScoringColor ||
        newScore >
          (closestCluster.scores.get(
            closestCluster.mostScoringColor.packRGB(),
          ) ?? 0)
      ) {
        closestCluster.mostScoringColor = color;
      }

      closestCluster.members.push(color);
    }

    const results = clusters
      .filter((e) => e.mostScoringColor)
      .map((cluster) => ({
        color: cluster.mostScoringColor!,
        count: cluster.members.length,
        score: cluster.totalScore,
      }))
      .sort((a, b) => b.score - a.score);

    const mergedResults: typeof results = [];
    const MERGE_THRESHOLD = 0.05;

    for (const candidate of results) {
      let isDuplicate = false;

      for (const existing of mergedResults) {
        const dist = candidate.color.distanceCartesianTo(
          existing.color,
          "oklab",
        );

        if (dist < MERGE_THRESHOLD) {
          existing.score += candidate.score;
          existing.count += candidate.count;
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        mergedResults.push(candidate);
      }
    }

    return mergedResults.sort((a, b) => b.score - a.score);
  }
}
