import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getRaceDetails, getDrivers, getUserProfile, ApexEntity } from '../services/graphql';
import { RaceEntity } from '../components/race_details/RaceDetailsCard';
import { useAuth } from './AuthContext';

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
    profile: ApexEntity | null;
    isLoading: boolean;
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
    const [profile, setProfile] = useState<ApexEntity | null>(null);
    const [isLoading, setIsLoading] = useState(true);
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
            const raceData = await getRaceDetails();
            const raceEntities: RaceEntity[] = raceData
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
            setRaces(raceEntities);
        } catch (err: any) {
            console.error('Error fetching races:', err);
            setRacesError(err.message || 'Failed to load races');
            setRaces([]);
        }
    };

    const fetchProfile = async () => {
        if (!user?.userId) {
            setProfile(null);
            return;
        }

        try {
            setProfileError(null);
            const profileData = await getUserProfile(user.userId);
            setProfile(profileData);
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            setProfileError(err.message || 'Failed to load profile');
            setProfile(null);
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
            setProfile(null);
            setIsLoading(false);
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
                profile,
                isLoading,
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

