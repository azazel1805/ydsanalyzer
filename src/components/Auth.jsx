// src/components/Auth.jsx
import { useState } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

const Auth = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
        }
    };
    
    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).catch(err => setError(err.message));
    }

    return (
        <div className="auth-container">
            <div className="auth-widget">
                <header>
                    <h1>YDS Analiz Asistanı</h1>
                    <p>Devam etmek için giriş yapın veya kaydolun.</p>
                </header>
                <form>
                    <input type="email" placeholder="E-posta adresiniz" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Şifreniz" value={password} onChange={(e) => setPassword(e.target.value)} />
                    {error && <p className="error-message">{error}</p>}
                    <div className="auth-buttons">
                        <button onClick={handleSignIn}>Giriş Yap</button>
                        <button onClick={handleSignUp}>Kaydol</button>
                    </div>
                </form>
                <div className="social-login">
                    <p>veya</p>
                    <button onClick={signInWithGoogle}>Google ile Giriş Yap</button>
                </div>
            </div>
        </div>
    );
};
export default Auth;
