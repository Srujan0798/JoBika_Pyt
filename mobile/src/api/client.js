import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from './config';

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const apiCall = async (endpoint, method = 'GET', body = null) => {
    try {
        const headers = await getHeaders();
        const config = {
            method,
            headers,
            ...(body ? { body: JSON.stringify(body) } : {}),
        };

        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};
