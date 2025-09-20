// src/components/Auth.jsx
import { useState } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup, // signInWithRedirect yerine tekrar bunu import ediyoruz
  GoogleAuthProvider
} from 'firebase/auth';

const Auth = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAction = async (action) => {
        setLoading(true);
        setError('');
        try {
            await action(auth, email, password);
        } catch (err) {
            // ... (Hata mesajı yönetimi aynı kalabilir)
            setError(err.message || 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // Başarılı girişten sonra App.jsx/Router.jsx yönlendirmeyi halledecek
        } catch (err) {
            setError(err.message || "Google ile giriş sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }

    // ... (return bloğu aynı kalabilir)
    return (
        <div className="auth-container">
            <div className="auth-widget">
                <header>
                    <h1>YDS Analiz Asistanı</h1>
                    <p>Devam etmek için giriş yapın veya kaydolun.</p>
                </header>
                <form onSubmit={(e) => e.preventDefault()}>
                    {/* ... inputlar ... */}
                    {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
                    <div className="auth-buttons">
                        <button onClick={() => handleAction(signInWithEmailAndPassword)} disabled={loading}>
                            {loading ? '...' : 'Giriş Yap'}
                        </button>
                        <button onClick={() => handleAction(createUserWithEmailAndPassword)} disabled={loading}>
                            {loading ? '...' : 'Kaydol'}
                        </button>
                    </div>
                </form>
                <div className="social-login">
                    <p>veya</p>
                    <button onClick={signInWithGoogle} disabled={loading} style={{width: '100%'}}>
                        Google ile Devam Et
                    </button>
                </div>
            </div>
        </div>
    );
};
export default Auth;
