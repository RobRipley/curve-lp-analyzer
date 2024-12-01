import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

function DataDisplay({ poolId }) {
    const [poolData, setPoolData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchPoolData() {
            try {
                const response = await fetch(`${API_BASE_URL}/get-pool-info?address=${poolId}`);
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

    const formatNumber = (num, decimals = 2) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(parseFloat(num));
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
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
                        <h2 className="text-2xl font-bold mb-2">{poolData.name || 'Pool Name Not Available'}</h2>
                        <p className="text-lg">Symbol: {poolData.symbol}</p>
                        <p className="text-lg">Pool Type: {poolData._isMetapool ? 'Metapool' : 'Regular Pool'}</p>
                    </div>
                    <div className="text-xl">
                        <div>
                            <span className="font-semibold">Total Value Locked: </span>
                            <span>${formatNumber(poolData.totalValueLockedUSD)}</span>
                        </div>
                        <div>
                            <span className="font-semibold">Cumulative Volume: </span>
                            <span>${formatNumber(poolData.cumulativeVolumeUSD)}</span>
                        </div>
                    </div>
                </div>

                {/* Token Table */}
                <div className="overflow-x-auto mt-6">
                    <h3 className="text-xl font-semibold mb-4">Pool Tokens</h3>
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-sm font-semibold">Token</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Balance</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Price (USD)</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold">Weight</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {poolData.inputTokens.map((token, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium">{token.symbol}</td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        {formatNumber(poolData.inputTokenBalances[index], token.decimals)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        ${formatNumber(token.lastPriceUSD)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        {poolData.inputTokenWeights ? 
                                            formatNumber(poolData.inputTokenWeights[index] * 100) + '%' 
                                            : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Daily Snapshots */}
                        <div>
                            <h4 className="text-lg font-medium mb-3">Daily Statistics</h4>
                            <div className="bg-gray-50 p-4 rounded">
                                {poolData.dailySnapshots.map((snapshot, index) => (
                                    <div key={index} className="mb-2">
                                        <p>Date: {formatDate(snapshot.timestamp)}</p>
                                        <p>Volume: ${formatNumber(snapshot.dailyVolumeUSD)}</p>
                                        <p>TVL: ${formatNumber(snapshot.totalValueLockedUSD)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fee Information */}
                        <div>
                            <h4 className="text-lg font-medium mb-3">Fee Information</h4>
                            <div className="bg-gray-50 p-4 rounded">
                                <p>Supply Side Revenue: ${formatNumber(poolData.cumulativeSupplySideRevenueUSD)}</p>
                                <p>Protocol Side Revenue: ${formatNumber(poolData.cumulativeProtocolSideRevenueUSD)}</p>
                                {poolData.fees && poolData.fees.map((fee, index) => (
                                    <p key={index}>
                                        {fee.feeType}: {formatNumber(fee.feePercentage * 100)}%
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DataDisplay;