import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getRaces, getDrivers, getResults, getMyProfile, type UserProfile, type Race, type Driver as GraphQLDriver, type Result } from '../services/graphql';
import { RaceEntity } from '../components/race_details/RaceDetailsCard';
import { useAuth } from './AuthContext';
import { RaceResultsData } from '../utils/pointsCalculator';

export type Driver = {
    id: string;
    name: string;
    team: string;
    number: number;
    nationality?: string;
    teamColor?: string;
};

interface DataContextType {
    drivers: Driver[];
    races: RaceEntity[];
    racesWithResults: RaceEntity[];
    raceResultsByRaceId: Map<string, RaceResultsData>;
    profile: UserProfile | null | undefined;
    isLoading: boolean;
    profileLoading: boolean;
    driversError: string | null;
    racesError: string | null;
    profileError: string | null;
    refetchDrivers: () => Promise<void>;
    refetchRaces: () => Promise<void>;
    refetchProfile: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [races, setRaces] = useState<RaceEntity[]>([]);
    const [racesWithResults, setRacesWithResults] = useState<RaceEntity[]>([]);
    const [raceResultsByRaceId, setRaceResultsByRaceId] = useState<Map<string, RaceResultsData>>(new Map());
    const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [driversError, setDriversError] = useState<string | null>(null);
    const [racesError, setRacesError] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Convert GraphQL driver to local Driver type
    const mapDriver = (item: GraphQLDriver): Driver => ({
        id: String(item.driverId ?? item.PK ?? item.name ?? ''),
        name: String(item.name ?? ''),
        team: String(item.team ?? ''),
        number: Number(item.number ?? 0),
        nationality: item.nationality ?? undefined,
        teamColor: item.teamColor ?? undefined,
    });


    // Keep separate functions for refetching individual resources (backwards compatibility)
    const fetchDrivers = async () => {
        try {
            setDriversError(null);
            const category = 'f1';
            const season = new Date().getFullYear().toString();
            const driversData = await getDrivers(category, season, 100);
            const mappedDrivers = driversData
                .filter((it) => it.entityType === 'DRIVER' && it.isActive === true)
                .map(mapDriver)
                .sort((a, b) => {
                    if (a.team !== b.team) {
                        return a.team.localeCompare(b.team);
                    }
                    return a.name.localeCompare(b.name);
                });
            setDrivers(mappedDrivers);
        } catch (err: any) {
            setDriversError(err.message || 'Failed to load drivers');
            setDrivers([]);
        }
    };

    const fetchRaces = async () => {
        try {
            setRacesError(null);
            const category = 'f1';
            const season = new Date().getFullYear().toString();

            // Fetch races and results in parallel
            // Handle getResults errors gracefully - if it fails, just use empty results
            let racesData: Race[] = [];
            let resultsData: Result[] = [];

            try {
                [racesData, resultsData] = await Promise.all([
                    getRaces(category, season, 100),
                    getResults(category, season, 100).catch((err) => {
                        console.warn('[DataContext] Error fetching results, continuing without results:', err);
                        return []; // Return empty array if results fail
                    }),
                ]);
            } catch (err: any) {
                // If getRaces fails, that's a critical error
                throw err;
            }

            // Map all race data to RaceEntity format
            const allRaceEntities: RaceEntity[] = racesData
                .filter((item): item is Race => item.entityType === 'RACE')
                .map((item) => ({
                    entityType: 'RACE' as const,
                    raceId: item.raceId || '',
                    raceName: item.raceName || '',
                    season: item.season || '',
                    qualyDate: item.qualyDate || '',
                    raceDate: item.raceDate || '',
                    category: item.category || '',
                    circuit: item.circuit || '',
                    country: item.country || '',
                    status: item.status || 'upcoming',
                    hasSprint: item.hasSprint || false,
                }))
                .sort((a, b) => Date.parse(a.qualyDate) - Date.parse(b.qualyDate));

            setRaces(allRaceEntities);

            // Process results and create raceResultsByRaceId map
            const resultsMap = new Map<string, RaceResultsData>();
            const raceIdsWithResults = new Set<string>();

            resultsData
                .filter((item): item is Result => item.entityType === 'RESULT' && !!item.results)
                .forEach((result) => {
                    try {
                        // AWSJSON can be a string or object - normalize to object
                        // Handle it the same way predictions are handled
                        let parsedResults: RaceResultsData | null = null;

                        if (result.results === null || result.results === undefined) {
                            return; // Skip null/undefined results
                        }

                        if (typeof result.results === 'string') {
                            // It's a JSON string, parse it
                            // Check if it's already a valid JSON string or needs parsing
                            const trimmed = result.results.trim();
                            if (trimmed === '' || trimmed === 'null') {
                                return; // Skip empty or null strings
                            }
                            // Check if it looks like JSON (starts with { or [)
                            if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                                console.error(`[DataContext] Results string doesn't look like JSON for raceId ${result.raceId}. First 100 chars:`, trimmed.substring(0, 100));
                                return;
                            }
                            try {
                                parsedResults = JSON.parse(result.results) as RaceResultsData;
                            } catch (parseError) {
                                // If parsing fails, log the actual value for debugging
                                console.error(`[DataContext] Error parsing results string for raceId ${result.raceId}:`, parseError);
                                console.error(`[DataContext] Results string (first 200 chars):`, result.results.substring(0, 200));
                                return;
                            }
                        } else if (typeof result.results === 'object' && result.results !== null) {
                            // It's already an object, use it directly (AWSJSON from DynamoDB Map)
                            // This is the expected case when stored as Map in DynamoDB
                            parsedResults = result.results as RaceResultsData;
                        } else {
                            // Invalid type
                            console.error(`[DataContext] Invalid results type for raceId ${result.raceId}:`, typeof result.results, 'Value:', result.results);
                            return;
                        }

                        // Validate the structure - must have gridOrder array (same format as predictions)
                        if (parsedResults &&
                            parsedResults.gridOrder &&
                            Array.isArray(parsedResults.gridOrder) &&
                            parsedResults.gridOrder.length > 0) {
                            resultsMap.set(result.raceId, parsedResults);
                            raceIdsWithResults.add(result.raceId);
                        } else {
                            console.warn(`[DataContext] Results for raceId ${result.raceId} missing gridOrder or invalid structure. Parsed:`, parsedResults);
                        }
                    } catch (parseError) {
                        // Skip invalid results
                        console.error(`[DataContext] Error processing results for raceId ${result.raceId}:`, parseError);
                        console.error(`[DataContext] Results type:`, typeof result.results);
                        console.error(`[DataContext] Results value (first 500 chars):`,
                            typeof result.results === 'string'
                                ? result.results.substring(0, 500)
                                : JSON.stringify(result.results).substring(0, 500));
                    }
                });

            setRaceResultsByRaceId(resultsMap);

            // Filter races that have results
            const racesWithResultsList = allRaceEntities.filter((race) =>
                raceIdsWithResults.has(race.raceId)
            );
            setRacesWithResults(racesWithResultsList);
        } catch (err: any) {
            setRacesError(err.message || 'Failed to load races');
            setRaces([]);
            setRacesWithResults([]);
            setRaceResultsByRaceId(new Map());
        }
    };

    const fetchProfile = async () => {
        if (!user?.userId) {
            setProfile(null);
            setProfileLoading(false);
            return;
        }

        setProfileLoading(true);
        try {
            setProfileError(null);
            const profileData = await getMyProfile();
            setProfile(profileData);
        } catch (err: any) {
            setProfileError(err.message || 'Failed to load profile');
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    };

    // Fetch all data when app starts and user is authenticated
    useEffect(() => {
        if (isAuthenticated) {
            setIsLoading(true);
            // Fetch drivers and races in parallel
            // Wrap in try-catch to prevent errors from breaking the provider
            Promise.all([fetchDrivers(), fetchRaces()])
                .catch((error) => {
                    console.error('[DataContext] Error fetching data:', error);
                })
                .finally(() => {
                    setIsLoading(false);
                });
            // Fetch profile if userId is available
            if (user?.userId) {
                fetchProfile().catch((error) => {
                    console.error('[DataContext] Error fetching profile:', error);
                });
            }
        } else {
            // Clear data when not authenticated
            setDrivers([]);
            setRaces([]);
            setRacesWithResults([]);
            setRaceResultsByRaceId(new Map());
            setProfile(null);
            setIsLoading(false);
            setProfileLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    // Refetch profile when userId changes
    useEffect(() => {
        if (isAuthenticated && user?.userId) {
            fetchProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.userId]);

    return (
        <DataContext.Provider
            value={{
                drivers,
                races,
                racesWithResults,
                raceResultsByRaceId,
                profile,
                isLoading,
                profileLoading,
                driversError,
                racesError,
                profileError,
                refetchDrivers: fetchDrivers,
                refetchRaces: fetchRaces,
                refetchProfile: fetchProfile,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
