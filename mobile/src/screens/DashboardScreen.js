import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { apiCall } from '../api/client';
import { StatusBar } from 'expo-status-bar';

export default function DashboardScreen() {
    const { logout, userInfo } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalApplications: 0,
        interviews: 0,
        profileViews: 0
    });
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            // In a real app, we would have a dedicated stats endpoint
            // For now, we'll simulate or fetch what we can
            // const data = await apiCall('/analytics'); 
            // setStats(data);

            // Simulating data for now as per backend capabilities
            setStats({
                totalApplications: 12,
                interviews: 3,
                profileViews: 45
            });
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.username}>{userInfo?.fullName || 'User'}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.statsGrid}>
                    <View style={[styles.card, styles.cardBlue]}>
                        <Text style={styles.cardValue}>{stats.totalApplications}</Text>
                        <Text style={styles.cardTitle}>Applications</Text>
                    </View>
                    <View style={[styles.card, styles.cardGreen]}>
                        <Text style={styles.cardValue}>{stats.interviews}</Text>
                        <Text style={styles.cardTitle}>Interviews</Text>
                    </View>
                    <View style={[styles.card, styles.cardPurple]}>
                        <Text style={styles.cardValue}>{stats.profileViews}</Text>
                        <Text style={styles.cardTitle}>Profile Views</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <View style={styles.activityCard}>
                        <Text style={styles.activityText}>Applied to Senior Developer at TechCorp</Text>
                        <Text style={styles.activityTime}>2 hours ago</Text>
                    </View>
                    <View style={styles.activityCard}>
                        <Text style={styles.activityText}>New job match: Frontend Engineer</Text>
                        <Text style={styles.activityTime}>5 hours ago</Text>
                    </View>
                </View>
            </ScrollView>
            <StatusBar style="dark" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    greeting: {
        fontSize: 16,
        color: '#6b7280',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    logoutBtn: {
        padding: 8,
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    card: {
        width: '31%',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardBlue: { backgroundColor: '#e0e7ff' },
    cardGreen: { backgroundColor: '#dcfce7' },
    cardPurple: { backgroundColor: '#f3e8ff' },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '500',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 15,
    },
    activityCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    activityText: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
    },
    activityTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
});
