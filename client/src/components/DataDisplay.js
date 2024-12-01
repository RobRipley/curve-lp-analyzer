import React from 'react';

function DataDisplay({ poolData }) {
    const formatNumber = (num, decimals = 2) => {
        const number = parseFloat(num);
        if (isNaN(number)) return '0';
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(number);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded">
                            <h3 className="text-lg font-medium mb-2">Overview</h3>
                            <p className="mb-2">TVL: ${formatNumber(poolData.totalValueLockedUSD)}</p>
                            <p>Volume: ${formatNumber(poolData.cumulativeVolumeUSD)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded">
                            <h3 className="text-lg font-medium mb-2">Revenue</h3>
                            <p className="mb-2">Supply Side: ${formatNumber(poolData.cumulativeSupplySideRevenueUSD)}</p>
                            <p>Protocol Side: ${formatNumber(poolData.cumulativeProtocolSideRevenueUSD)}</p>
                        </div>
                    </div>
                </div>

                {/* Token Table */}
                {poolData.inputTokens && poolData.inputTokens.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Pool Tokens</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price (USD)</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {poolData.inputTokens.map((token, index) => (
                                        <tr key={token.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {token.symbol}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                {formatNumber(poolData.inputTokenBalances[index], token.decimals)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                ${formatNumber(token.lastPriceUSD)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                {poolData.inputTokenWeights 
                                                    ? formatNumber(poolData.inputTokenWeights[index] * 100) + '%' 
                                                    : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Recent Activity */}
                {poolData.dailySnapshots && poolData.dailySnapshots.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {poolData.dailySnapshots.map((snapshot, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded">
                                    <p className="font-medium mb-2">{formatDate(snapshot.timestamp)}</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <p>Volume: ${formatNumber(snapshot.dailyVolumeUSD)}</p>
                                        <p>TVL: ${formatNumber(snapshot.totalValueLockedUSD)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DataDisplay;