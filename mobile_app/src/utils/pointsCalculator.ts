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
    // IMPORTANT: Pole position comes from additionalPredictions.pole, NOT from gridOrder position 1
    // Position 1 in gridOrder is the race winner, which may be different from the pole sitter
    const actualPole = raceResults.additionalPredictions?.pole;
    const predictedPole = predictions.additionalPredictions?.pole;
    if (actualPole !== null && actualPole !== undefined && 
        predictedPole !== null && predictedPole !== undefined && 
        actualPole === predictedPole) {
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
 * Calculate bonus points based on race performance predictions
 * Returns an object with earned bonus points and their status
 */
export type BonusPoints = {
    winner: { earned: boolean; points: number };
    podium: { earned: boolean; points: number };
    top6: { earned: boolean; points: number };
    allCorrect: { earned: boolean; points: number };
    total: number;
};

export function calculateBonusPoints(
    predictions: PredictionData,
    raceResults: RaceResultsData
): BonusPoints {
    const bonus: BonusPoints = {
        winner: { earned: false, points: 0 },
        podium: { earned: false, points: 0 },
        top6: { earned: false, points: 0 },
        allCorrect: { earned: false, points: 0 },
        total: 0,
    };

    // Helper function to check if a predicted position matches actual position
    const isPositionCorrect = (predictedPosition: number): boolean => {
        const prediction = predictions.gridOrder.find((p) => p.position === predictedPosition);
        if (!prediction || prediction.driverNumber === null) return false;

        const actualResult = raceResults.gridOrder.find((r) => r.driverNumber === prediction.driverNumber);
        if (!actualResult) return false;

        return actualResult.position === predictedPosition;
    };

    // Winner (position 1)
    if (isPositionCorrect(1)) {
        bonus.winner = { earned: true, points: 10 };
    }

    // Podium (positions 1, 2, 3)
    const podiumCorrect = isPositionCorrect(1) && isPositionCorrect(2) && isPositionCorrect(3);
    if (podiumCorrect) {
        bonus.podium = { earned: true, points: 30 };
    }

    // Top 6 (any 6 predictions correct)
    let correctCount = 0;
    for (let position = 1; position <= 10; position++) {
        if (isPositionCorrect(position)) {
            correctCount++;
        }
    }
    if (correctCount >= 6) {
        bonus.top6 = { earned: true, points: 60 };
    }

    // All drivers correct (positions 1-10)
    const allCorrect =
        isPositionCorrect(1) &&
        isPositionCorrect(2) &&
        isPositionCorrect(3) &&
        isPositionCorrect(4) &&
        isPositionCorrect(5) &&
        isPositionCorrect(6) &&
        isPositionCorrect(7) &&
        isPositionCorrect(8) &&
        isPositionCorrect(9) &&
        isPositionCorrect(10);
    if (allCorrect) {
        bonus.allCorrect = { earned: true, points: 100 };
    }

    // Calculate total bonus points (only count earned bonuses)
    bonus.total = bonus.winner.points + bonus.podium.points + bonus.top6.points + bonus.allCorrect.points;

    return bonus;
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

