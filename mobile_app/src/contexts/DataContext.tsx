import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getRaces, getDrivers, getMyProfile, type UserProfile, type Race, type Driver as GraphQLDriver } from '../services/graphql';
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
    profile: UserProfile | null;
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
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [driversError, setDriversError] = useState<string | null>(null);
    const [racesError, setRacesError] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Convert GraphQL driver to local Driver type
    const mapDriver = (item: GraphQLDriver): Driver => ({
        id: String(item.driver_id ?? item.PK ?? item.name ?? ''),
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
            const category = 'F1';
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
            const category = 'F1';
            const season = new Date().getFullYear().toString();
            const racesData = await getRaces(category, season, 100);

            // Map all race data to RaceEntity format
            const allRaceEntities: RaceEntity[] = racesData
                .filter((item): item is Race => item.entityType === 'RACE')
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
                .sort((a, b) => Date.parse(a.qualy_date) - Date.parse(b.qualy_date));

            setRaces(allRaceEntities);
            // For now, set racesWithResults to empty - can be updated later if needed
            setRacesWithResults([]);
        } catch (err: any) {
            setRacesError(err.message || 'Failed to load races');
            setRaces([]);
            setRacesWithResults([]);
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
