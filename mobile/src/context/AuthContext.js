import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const login = async (email, password, twoFactorCode = null) => {
        try {
            const body = { email, password };
            if (twoFactorCode) {
                body.twoFactorCode = twoFactorCode;
            }

            const data = await apiCall('/auth/login', 'POST', body);

            // Handle 2FA challenge
            if (data.require2fa) {
                return { require2fa: true };
            }

            // Login success
            setUserToken(data.token);
            setUserInfo(data.user);
            await AsyncStorage.setItem('userToken', data.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let userToken = await AsyncStorage.getItem('userToken');
            let userInfo = await AsyncStorage.getItem('userInfo');

            if (userToken) {
                setUserToken(userToken);
                setUserInfo(JSON.parse(userInfo));
            }
            setIsLoading(false);
        } catch (e) {
            console.log(`isLoggedIn error ${e}`);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
