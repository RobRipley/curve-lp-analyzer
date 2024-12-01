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
            // Use the API_BASE_URL to make the request
            const response = await fetch(`${API_BASE_URL}/api/get-pool-info?address=${encodedAddress}`);
            const data = await response.json();

            if (response.ok) {
                setPoolData(data);
            } else {
                throw new Error(data.error || 'Failed to fetch pool data');
            }
        } catch (err) {
            setError(`Error fetching data: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Curve Pool Data Viewer</h1>
            
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <input
                    type="text"
                    value={poolAddress}
                    onChange={(e) => setPoolAddress(e.target.value)}
                    placeholder="Enter Pool Address"
                    className="flex-1 p-2 border rounded"
                />
                <button 
                    onClick={fetchData}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {isLoading ? 'Loading...' : 'Fetch Pool Data'}
                </button>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-600 rounded">
                    {error}
                </div>
            )}
            
            {poolData && <DataDisplay poolData={poolData} />}
        </div>
    );
}

export default App;
