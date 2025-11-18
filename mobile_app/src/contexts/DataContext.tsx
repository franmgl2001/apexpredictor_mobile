import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getRaceDetails, getRaceResults, getDrivers, getUserProfile, ApexEntity } from '../services/graphql';
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
    profile: ApexEntity | null;
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
    const [profile, setProfile] = useState<ApexEntity | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [driversError, setDriversError] = useState<string | null>(null);
    const [racesError, setRacesError] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Convert ApexEntity driver to Driver type
    const mapDriver = (item: ApexEntity): Driver => ({
        id: String(item.driver_id ?? item.PK ?? item.name ?? ''),
        name: String(item.name ?? ''),
        team: String(item.team ?? ''),
        number: Number(item.number ?? 0),
        nationality: item.nationality ?? undefined,
        teamColor: item.teamColor ?? undefined,
    });

    const fetchDrivers = async () => {
        try {
            setDriversError(null);
            const driverData = await getDrivers('2025');
            const mappedDrivers = driverData
                .filter((it) => it.entityType === 'DRIVER')
                .map(mapDriver)
                // Sort by team, then by name within team
                .sort((a, b) => {
                    if (a.team !== b.team) {
                        return a.team.localeCompare(b.team);
                    }
                    return a.name.localeCompare(b.name);
                });
            setDrivers(mappedDrivers);
        } catch (err: any) {
            console.error('Error fetching drivers:', err);
            setDriversError(err.message || 'Failed to load drivers');
            setDrivers([]);
        }
    };

    const fetchRaces = async () => {
        try {
            setRacesError(null);
            // Fetch both race details and race results in parallel
            const [raceData, raceResultsData] = await Promise.all([
                getRaceDetails(),
                getRaceResults(),
            ]);

            // Extract race_ids from race results to filter races
            const raceIdsWithResults = new Set(
                raceResultsData
                    .map((result) => {
                        // Try race_id field first, then extract from PK if needed
                        if (result.race_id) {
                            return result.race_id;
                        }
                        // PK format is "race#race_id", extract race_id
                        if (result.PK && result.PK.startsWith('race#')) {
                            return result.PK.replace('race#', '');
                        }
                        return null;
                    })
                    .filter((id): id is string => !!id)
            );

            // Map all race data to RaceEntity format
            const allRaceEntities: RaceEntity[] = raceData
                .filter((item): item is ApexEntity & { entityType: 'RACE' } => item.entityType === 'RACE')
                .map((item) => ({
                    entityType: 'RACE' as const,
                    race_id: item.race_id || '',
                    race_name: item.race_name || '',
                    season: item.season || '',
                    qualy_date: item.qualy_date || '',
                    race_date: item.race_date || '',
                    category: item.category || '',
                    circuit: item.circuit || '',
                    country: item.country || '',
                    status: item.status || 'upcoming',
                    has_sprint: item.has_sprint || false,
                }))
                // Sort by qualy_date ascending
                .sort((a, b) => Date.parse(a.qualy_date) - Date.parse(b.qualy_date));

            // Store all races (unfiltered)
            setRaces(allRaceEntities);

            // Filter races to only include those with results
            const racesWithResultsFiltered = allRaceEntities.filter((race) => {
                const raceId = race.race_id || '';
                return raceIdsWithResults.has(raceId);
            });
            setRacesWithResults(racesWithResultsFiltered);

            // Parse and store race results by race ID
            const resultsMap = new Map<string, RaceResultsData>();
            raceResultsData.forEach((result) => {
                const resultRaceId = result.race_id || (result.PK?.startsWith('race#') ? result.PK.replace('race#', '') : null);
                if (resultRaceId && result.results) {
                    try {
                        const parsedResults = JSON.parse(result.results) as RaceResultsData;
                        resultsMap.set(resultRaceId, parsedResults);
                    } catch (error) {
                        console.error(`Error parsing race results for ${resultRaceId}:`, error);
                    }
                }
            });
            setRaceResultsByRaceId(resultsMap);
        } catch (err: any) {
            console.error('Error fetching races:', err);
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
            const profileData = await getUserProfile(user.userId);
            setProfile(profileData);
        } catch (err: any) {
            console.error('Error fetching profile:', err);
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
            // Fetch drivers and races once when authenticated
            Promise.all([fetchDrivers(), fetchRaces()]).finally(() => {
                setIsLoading(false);
            });
            // Fetch profile if userId is available
            if (user?.userId) {
                fetchProfile();
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

