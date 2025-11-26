import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiCall } from '../api/client';
import { StatusBar } from 'expo-status-bar';

export default function JobsScreen() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredJobs, setFilteredJobs] = useState([]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const data = await apiCall('/jobs');
            setJobs(data);
            setFilteredJobs(data);
        } catch (error) {
            console.error('Failed to fetch jobs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = jobs.filter(job =>
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                job.company.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredJobs(filtered);
        } else {
            setFilteredJobs(jobs);
        }
    }, [searchQuery, jobs]);

    const renderJobItem = ({ item }) => (
        <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
                <View>
                    <Text style={styles.jobTitle}>{item.title}</Text>
                    <Text style={styles.companyName}>{item.company}</Text>
                </View>
                <View style={styles.matchBadge}>
                    <Text style={styles.matchScore}>{item.match_score}%</Text>
                </View>
            </View>

            <View style={styles.jobDetails}>
                <Text style={styles.detailText}>📍 {item.location}</Text>
                <Text style={styles.detailText}>💰 {item.salary_range || 'Not specified'}</Text>
            </View>

            <TouchableOpacity style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>Easy Apply</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Find Jobs</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search jobs, companies..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                </View>
            ) : (
                <FlatList
                    data={filteredJobs}
                    renderItem={renderJobItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshing={loading}
                    onRefresh={fetchJobs}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No jobs found</Text>
                        </View>
                    }
                />
            )}
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
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    searchInput: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    jobCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    jobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    companyName: {
        fontSize: 14,
        color: '#6b7280',
    },
    matchBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    matchScore: {
        color: '#166534',
        fontWeight: 'bold',
        fontSize: 12,
    },
    jobDetails: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    detailText: {
        fontSize: 13,
        color: '#4b5563',
    },
    applyBtn: {
        backgroundColor: '#4f46e5',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    applyBtnText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
    },
});
