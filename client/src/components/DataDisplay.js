import React, { useState, useEffect } from 'react';

// Define your backend URL dynamically from environment variables
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

function DataDisplay({ poolId }) {
    const [poolData, setPoolData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch pool data when the component mounts or `poolId` changes
        async function fetchPoolData() {
            try {
                const response = await fetch(`${API_BASE_URL}/api/get-pool-info?address=${poolId}`);
                if (!response.ok) {
                    throw new Error(`Error fetching data: ${response.statusText}`);
                }
                const data = await response.json();
                setPoolData(data);
            } catch (err) {
                setError(err.message);
            }
        }

        if (poolId) {
            fetchPoolData();
        }
    }, [poolId]);

    const [showFullAddress, setShowFullAddress] = useState({});

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const formatPercent = (num) => {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const formatAddress = (address, id) => {
        if (showFullAddress[id]) {
            return address;
        }
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const toggleAddress = (id) => {
        setShowFullAddress((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const calculateTokenPercentage = (tokenValueUSD) => {
        const totalValue = parseFloat(poolData?.metrics?.tvl || 0);
        return parseFloat(tokenValueUSD) / totalValue;
    };

    const calculatePositionPercentage = (positionUSD) => {
        return parseFloat(positionUSD) / parseFloat(poolData?.metrics?.tvl || 1);
    };

    if (error) {
        return <div className="p-4 max-w-7xl mx-auto text-red-600">Error: {error}</div>;
    }

    if (!poolData) {
        return <div className="p-4 max-w-7xl mx-auto">Loading pool data...</div>;
    }

    return (
        <div className="p-4 max-w-7xl mx-auto">
            {/* Pool Overview Card */}
            <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
                <div className="mb-6">
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold mb-2">{poolData.poolName}</h2>
                        <p className="text-lg">Pool Type: {poolData.isMetapool ? 'Metapool' : 'Regular Pool'}</p>
                    </div>
                    <div className="text-xl">
                        <span className="font-semibold">TVL: </span>
                        <span>${formatNumber(poolData.metrics.tvl)} </span>
                        <span
                            className={`ml-2 ${
                                parseFloat(poolData.metrics.tvlChange) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                            ({poolData.metrics.tvlChange})
                        </span>
                    </div>
                </div>

                {/* Token Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-sm font-semibold">Token</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Balance</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Token Price</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Value</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">% of Pool</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {poolData.tokens.map((token, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium">{token.symbol}</td>
                                    <td className="px-6 py-4 text-right text-sm">{formatNumber(token.balance)}</td>
                                    <td className="px-6 py-4 text-right text-sm">${formatNumber(token.priceUSD)}</td>
                                    <td className="px-6 py-4 text-right text-sm">${formatNumber(token.valueUSD)}</td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        {formatPercent(calculateTokenPercentage(token.valueUSD))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Liquidity Providers Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Top 20 Liquidity Providers</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-sm font-semibold">Provider Address</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Net Position (USD)</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">% of Pool</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Total Deposited</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Total Withdrawn</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Transactions</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {poolData.topProviders.map((provider, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm">
                                        <button
                                            onClick={() => toggleAddress(index)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            {formatAddress(provider.address, index)}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">${formatNumber(provider.netPositionUSD)}</td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        {formatPercent(calculatePositionPercentage(provider.netPositionUSD))}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">${formatNumber(provider.totalDeposited)}</td>
                                    <td className="px-6 py-4 text-right text-sm">${formatNumber(provider.totalWithdrawn)}</td>
                                    <td className="px-6 py-4 text-right text-sm">{provider.transactions}</td>
                                    <td className="px-6 py-4 text-right text-sm">{formatDate(provider.lastActive)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DataDisplay;
