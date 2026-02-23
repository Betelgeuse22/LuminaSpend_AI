import React from 'react';
import { supabase } from '@/lib/supabase';
import { GlassCard } from './ui/GlassCard';
import { LogIn } from 'lucide-react';

export const Auth: React.FC = () => {
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) console.error('Error logging in:', error.message);
    };

    return (
        <div className="auth-overlay">
            <GlassCard glow className="auth-card">
                <div className="auth-content">
                    <div className="auth-icon-wrapper">
                        <LogIn size={40} className="text-blue-400" />
                    </div>
                    <h2 className="auth-title">Добро пожаловать</h2>
                    <p className="auth-subtitle">Управляйте своими расходами с помощью ИИ</p>
          
                    <button onClick={handleGoogleLogin} className="google-auth-btn">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                        Войти через Google
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};