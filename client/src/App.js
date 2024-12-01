import React, { useState } from 'react';
import DataDisplay from './components/DataDisplay';

// Define the backend URL dynamically from the environment variable
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

function App() {
    const [poolAddress, setPoolAddress] = useState('');
    const [poolData, setPoolData] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = async () => {
        if (!poolAddress.trim()) {
            setError('Please enter a pool address');
            return;
        }

        setError('');
        setPoolData(null);
        setIsLoading(true);

        try {
            const encodedAddress = encodeURIComponent(poolAddress.trim().toLowerCase());
            // Updated endpoint path to match new Vercel serverless function
            const response = await fetch(`${API_BASE_URL}/get-pool-info?address=${encodedAddress}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setPoolData(data);
            } else {
                // Enhanced error handling with more specific messages
                if (response.status === 404) {
                    throw new Error('Pool not found. Please verify the address and try again.');
                } else if (response.status === 400) {
                    throw new Error('Invalid pool address format.');
                } else {
                    throw new Error(data.error || 'Failed to fetch pool data');
                }
            }
        } catch (err) {
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                setError(`Network error: Unable to connect to the server. Please check your connection and try again.`);
            } else {
                setError(`Error: ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            fetchData();
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Curve Pool Data Viewer</h1>
            
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1">
                    <input
                        type="text"
                        value={poolAddress}
                        onChange={(e) => setPoolAddress(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter Pool Address (0x...)"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        disabled={isLoading}
                    />
                    <p className="text-sm text-gray-600 mt-1">
                        Enter the Ethereum address of a Curve Finance pool
                    </p>
                </div>
                <button 
                    onClick={fetchData}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors duration-200 min-w-[150px]"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                        </span>
                    ) : 'Fetch Pool Data'}
                </button>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-600 rounded">
                    <div className="font-medium">Error</div>
                    <div className="text-sm">{error}</div>
                </div>
            )}
            
            {!error && !poolData && !isLoading && (
                <div className="p-4 mb-6 bg-blue-50 border border-blue-200 text-blue-600 rounded">
                    Enter a Curve Finance pool address above to view its data
                </div>
            )}
            
            {poolData && <DataDisplay poolData={poolData} />}
        </div>
    );
}

export default App;