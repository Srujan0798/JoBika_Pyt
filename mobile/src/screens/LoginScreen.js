import React, { useContext, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (showTwoFactor && !twoFactorCode) {
            Alert.alert('Error', 'Please enter 2FA code');
            return;
        }

        setLoading(true);
        try {
            const response = await login(email, password, twoFactorCode || null);

            if (response && response.require2fa) {
                setShowTwoFactor(true);
                Alert.alert('2FA Required', 'Please enter the code from your authenticator app.');
            }
            // If success, AuthContext will update state and App.js will switch navigation
        } catch (error) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.formContainer}>
                <Text style={styles.title}>JoBika</Text>
                <Text style={styles.subtitle}>AI Job Agent</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!showTwoFactor}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!showTwoFactor}
                />

                {showTwoFactor && (
                    <View style={styles.twoFactorContainer}>
                        <Text style={styles.label}>Enter 2FA Code:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="000000"
                            value={twoFactorCode}
                            onChangeText={setTwoFactorCode}
                            keyboardType="number-pad"
                            maxLength={6}
                            autoFocus
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {showTwoFactor ? 'Verify & Sign In' : 'Sign In'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkButton}>
                    <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
                </TouchableOpacity>
            </View>
            <StatusBar style="auto" />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    formContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4f46e5',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 40,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: '#f9fafb',
    },
    twoFactorContainer: {
        width: '100%',
        marginBottom: 10,
    },
    label: {
        marginBottom: 5,
        fontWeight: '600',
        color: '#374151',
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#4f46e5',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#a5b4fc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 20,
    },
    linkText: {
        color: '#4f46e5',
        fontSize: 14,
    },
});
