// src/components/Auth.jsx
import { useState } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithRedirect, // signInWithPopup yerine bunu import ediyoruz
  GoogleAuthProvider
} from 'firebase/auth';

const Auth = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Yükleme durumu için

    const handleAction = async (action) => {
        setLoading(true);
        setError('');
        try {
            await action(auth, email, password);
            // Başarılı giriş/kayıt sonrası App.jsx'teki hook yönlendirmeyi yapacak
        } catch (err) {
            // Firebase'in hata kodlarından daha anlaşılır mesajlar üretebiliriz
            switch (err.code) {
                case 'auth/invalid-email':
                    setError('Geçersiz e-posta formatı.');
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError('E-posta veya şifre hatalı.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Bu e-posta adresi zaten kayıtlı.');
                    break;
                default:
                    setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        // Hata yakalamaya gerek yok, çünkü sayfa yönlenecek.
        // Hata olursa, kullanıcı Google sayfasında görecektir.
        signInWithRedirect(auth, provider);
    }

    return (
        <div className="auth-container">
            <div className="auth-widget">
                <header>
                    <h1>YDS Analiz Asistanı</h1>
                    <p>Devam etmek için giriş yapın veya kaydolun.</p>
                </header>
                <form onSubmit={(e) => e.preventDefault()}>
                    <input 
                        type="email" 
                        placeholder="E-posta adresiniz" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        disabled={loading}
                    />
                    <input 
                        type="password" 
                        placeholder="Şifreniz" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        disabled={loading}
                    />
                    {error && <p className="error-message" style={{color: 'red', fontSize: '0.9em', textAlign: 'center'}}>{error}</p>}
                    <div className="auth-buttons" style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                        <button onClick={() => handleAction(signInWithEmailAndPassword)} disabled={loading}>
                            {loading ? '...' : 'Giriş Yap'}
                        </button>
                        <button onClick={() => handleAction(createUserWithEmailAndPassword)} disabled={loading}>
                            {loading ? '...' : 'Kaydol'}
                        </button>
                    </div>
                </form>
                <div className="social-login" style={{textAlign: 'center', marginTop: '1.5rem'}}>
                    <p style={{marginBottom: '1rem'}}>veya</p>
                    <button onClick={signInWithGoogle} disabled={loading} style={{width: '100%', backgroundColor: '#db4437', color: 'white'}}>
                        Google ile Devam Et
                    </button>
                </div>
            </div>
        </div>
    );
};
export default Auth;
