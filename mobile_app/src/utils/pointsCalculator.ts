/**
 * Types for race results and predictions
 */
export type RaceResultsData = {
    gridOrder: Array<{ driverNumber: number; position: number }>;
    sprintPositions?: Array<{ driverNumber: number; position: number }>;
    additionalPredictions?: {
        positionsGained?: number | null;
        pole?: number | null;
        fastestLap?: number | null;
    };
};

export type PredictionData = {
    gridOrder: Array<{ position: number; driverNumber: number | null }>;
    sprintPositions?: Array<{ position?: number; driverNumber: number | null }>;
    additionalPredictions?: {
        pole?: number | null;
        fastestLap?: number | null;
        positionsGained?: number | null;
    };
};

export type DriverPoints = {
    driverNumber: number;
    points: number;
    breakdown: {
        gridPosition?: number;
        sprintPosition?: number;
        pole?: number;
        fastestLap?: number;
        positionsGained?: number;
    };
};

/**
 * Calculate points earned for each driver based on predictions vs race results
 */
export function calculateDriverPoints(
    predictions: PredictionData,
    raceResults: RaceResultsData,
    hasSprint: boolean = false
): Map<number, DriverPoints> {
    const driverPointsMap = new Map<number, DriverPoints>();

    // Initialize all drivers with 0 points
    const allDriverNumbers = new Set<number>();
    raceResults.gridOrder.forEach((item) => allDriverNumbers.add(item.driverNumber));
    raceResults.sprintPositions?.forEach((item) => allDriverNumbers.add(item.driverNumber));
    predictions.gridOrder.forEach((item) => {
        if (item.driverNumber) allDriverNumbers.add(item.driverNumber);
    });
    predictions.sprintPositions?.forEach((item) => {
        if (item.driverNumber) allDriverNumbers.add(item.driverNumber);
    });

    allDriverNumbers.forEach((driverNumber) => {
        driverPointsMap.set(driverNumber, {
            driverNumber,
            points: 0,
            breakdown: {},
        });
    });

    // Calculate grid position points
    // Based on scoring: correct = 10pts, miss by 1 = 5pts, miss by 2 = 2pts, miss by 3+ = 0pts
    predictions.gridOrder.forEach((pred) => {
        if (pred.driverNumber === null) return;

        const actualResult = raceResults.gridOrder.find((r) => r.driverNumber === pred.driverNumber);
        if (actualResult) {
            const positionDiff = Math.abs(actualResult.position - pred.position);
            let points = 0;

            if (positionDiff === 0) {
                points = 10; // Correct position
            } else if (positionDiff === 1) {
                points = 5; // Miss by 1
            } else if (positionDiff === 2) {
                points = 2; // Miss by 2
            } else {
                points = 0; // Miss by 3+
            }

            const driverPoints = driverPointsMap.get(pred.driverNumber);
            if (driverPoints) {
                driverPoints.points += points;
                if (!driverPoints.breakdown.gridPosition) {
                    driverPoints.breakdown.gridPosition = 0;
                }
                driverPoints.breakdown.gridPosition += points;
            }
        }
    });

    // Calculate sprint position points (if sprint exists)
    if (hasSprint && raceResults.sprintPositions && predictions.sprintPositions) {
        predictions.sprintPositions.forEach((pred) => {
            if (pred.driverNumber === null || pred.position === undefined) return;

            const actualSprint = raceResults.sprintPositions?.find((r) => r.driverNumber === pred.driverNumber);
            if (actualSprint) {
                const positionDiff = Math.abs(actualSprint.position - pred.position);
                let points = 0;

                if (positionDiff === 0) {
                    points = 10; // Correct position
                } else if (positionDiff === 1) {
                    points = 5; // Miss by 1
                } else if (positionDiff === 2) {
                    points = 2; // Miss by 2
                } else {
                    points = 0; // Miss by 3+
                }

                const driverPoints = driverPointsMap.get(pred.driverNumber);
                if (driverPoints) {
                    driverPoints.points += points;
                    if (!driverPoints.breakdown.sprintPosition) {
                        driverPoints.breakdown.sprintPosition = 0;
                    }
                    driverPoints.breakdown.sprintPosition += points;
                }
            }
        });
    }

    // Calculate pole position points
    const actualPole = raceResults.gridOrder.find((r) => r.position === 1)?.driverNumber;
    const predictedPole = predictions.additionalPredictions?.pole;
    if (actualPole && predictedPole && actualPole === predictedPole) {
        const driverPoints = driverPointsMap.get(actualPole);
        if (driverPoints) {
            driverPoints.points += 10; // 10 points for correct pole (based on rules)
            driverPoints.breakdown.pole = 10;
        }
    }

    // Calculate fastest lap points
    const actualFastestLap = raceResults.additionalPredictions?.fastestLap;
    const predictedFastestLap = predictions.additionalPredictions?.fastestLap;
    if (actualFastestLap && predictedFastestLap && actualFastestLap === predictedFastestLap) {
        const driverPoints = driverPointsMap.get(actualFastestLap);
        if (driverPoints) {
            driverPoints.points += 10; // 10 points for correct fastest lap (based on rules)
            driverPoints.breakdown.fastestLap = 10;
        }
    }

    // Calculate positions gained points
    // positionsGained is the driver number who gained the most positions
    const actualPositionsGainedDriver = raceResults.additionalPredictions?.positionsGained;
    const predictedPositionsGainedDriver = predictions.additionalPredictions?.positionsGained;
    if (actualPositionsGainedDriver !== null && actualPositionsGainedDriver !== undefined &&
        predictedPositionsGainedDriver !== null && predictedPositionsGainedDriver !== undefined &&
        actualPositionsGainedDriver === predictedPositionsGainedDriver) {
        const driverPoints = driverPointsMap.get(actualPositionsGainedDriver);
        if (driverPoints) {
            driverPoints.points += 10; // 10 points for correct positions gained prediction
            driverPoints.breakdown.positionsGained = 10;
        }
    }

    return driverPointsMap;
}

/**
 * Calculate total points for a driver across all races with results
 */
export function calculateDriverTotalPoints(
    driverNumber: number,
    raceResultsByRace: Map<string, RaceResultsData>,
    predictionsByRace: Map<string, PredictionData>,
    raceHasSprint: Map<string, boolean>
): number {
    let totalPoints = 0;

    raceResultsByRace.forEach((raceResults, raceId) => {
        const predictions = predictionsByRace.get(raceId);
        if (!predictions) return;

        const hasSprint = raceHasSprint.get(raceId) || false;
        const driverPointsMap = calculateDriverPoints(predictions, raceResults, hasSprint);
        const driverPoints = driverPointsMap.get(driverNumber);
        if (driverPoints) {
            totalPoints += driverPoints.points;
        }
    });

    return totalPoints;
}

