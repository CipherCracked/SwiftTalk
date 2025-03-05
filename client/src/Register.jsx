import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from './UserContext.jsx';

export default function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState('register');
    const [registerError, setRegisterError] = useState("");
    const [loginError, setLoginError]=useState("");
    const [otherError, setOtherError]=useState("");
    
    const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

    async function handleSubmit(ev) {
        ev.preventDefault();
        const url = isLogin === 'register' ? 'register' : 'login';
        try {
            const { data } = await axios.post(url, { username, password });
            setLoggedInUsername(username);
            setId(data.id);
        } catch (error) {
            if (error.response && error.response.status === 409) {
                // Username already exists
                setRegisterError("Username already exists. Please choose a different username.");
            }
            else if (error.response && error.response.status===401){
                setLoginError(error.response.data);
            }
            else {
                // Other errors
                setOtherError("An error occurred. Please try again later.");
            }
        }
    }

    return (
        <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">{isLogin === 'register' ? 'Register' : 'Login'}</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={ev => setUsername(ev.target.value)}
                            placeholder="Enter your username"
                            className="block w-full px-4 py-2 rounded-md bg-gray-100 border-2 border-gray-200 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={ev => setPassword(ev.target.value)}
                            placeholder="Enter your password"
                            className="block w-full px-4 py-2 rounded-md bg-gray-100 border-2 border-gray-200 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 text-white bg-purple-500 rounded-md hover:bg-purple-600 focus:outline-none focus:bg-purple-600 transition duration-300"
                    >
                        {isLogin === 'register' ? 'Register' : 'Login'}
                    </button>
                </form>
                {(registerError && isLogin=='register') && <p className="mt-2 text-sm text-red-600 text-center">{registerError}</p>}
                {(loginError && isLogin=='login') && <p className="mt-2 text-sm text-red-600 text-center">{loginError}</p>}
                {(otherError) && <p className="mt-2 text-sm text-red-600 text-center">{loginError}</p>}
                <div className="mt-4 text-center">
                    {isLogin === 'register' ? (
                        <p className="text-sm text-gray-600">Already have an account? <button className="text-purple-500 font-medium focus:outline-none" onClick={() => setIsLogin('login')}>Login here</button></p>
                    ) : (
                        <p className="text-sm text-gray-600">Don't have an account yet? <button className="text-purple-500 font-medium focus:outline-none" onClick={() => setIsLogin('register')}>Register now</button></p>
                    )}
                </div>
            </div>
        </div>
    );
}
