import React, { useMemo } from 'react';

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

    const formatTokenBalance = (balance, decimals) => {
        return balance / Math.pow(10, decimals);
    };

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (timestamp) => {
        return new Date(parseInt(timestamp) * 1000).toLocaleString();
    };

    // Calculate top providers from deposits and withdraws
    const topProviders = useMemo(() => {
        if (!poolData.deposits?.length && !poolData.withdraws?.length) {
            return [];
        }

        const providerMap = new Map();

        // Process deposits
        poolData.deposits.forEach(tx => {
            const provider = providerMap.get(tx.from) || {
                address: tx.from,
                totalDeposited: 0,
                totalWithdrawn: 0,
                lastActive: 0,
                transactions: 0
            };

            provider.totalDeposited += parseFloat(tx.amountUSD);
            provider.lastActive = Math.max(provider.lastActive, parseInt(tx.blockTimestamp));
            provider.transactions += 1;
            providerMap.set(tx.from, provider);
        });

        // Process withdrawals
        poolData.withdraws.forEach(tx => {
            const provider = providerMap.get(tx.from) || {
                address: tx.from,
                totalDeposited: 0,
                totalWithdrawn: 0,
                lastActive: 0,
                transactions: 0
            };

            provider.totalWithdrawn += parseFloat(tx.amountUSD);
            provider.lastActive = Math.max(provider.lastActive, parseInt(tx.blockTimestamp));
            provider.transactions += 1;
            providerMap.set(tx.from, provider);
        });

        // Calculate net positions and sort
        return Array.from(providerMap.values())
            .map(provider => ({
                ...provider,
                netPosition: provider.totalDeposited - provider.totalWithdrawn
            }))
            .sort((a, b) => b.netPosition - a.netPosition)
            .slice(0, 20);
    }, [poolData.deposits, poolData.withdraws]);

    return (
        <div className="p-4 max-w-7xl mx-auto">
            {/* Pool Overview */}
            <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{poolData.name || 'Pool Name Not Available'}</h2>
                    <p className="text-lg">Symbol: {poolData.symbol}</p>
                    <p className="text-lg">Pool Type: {poolData._isMetapool ? 'Metapool' : 'Regular Pool'}</p>
                </div>

                {/* Pool Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

                {/* Token Table */}
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
                                            {formatNumber(formatTokenBalance(poolData.inputTokenBalances[index], token.decimals))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                            ${formatNumber(token.lastPriceUSD)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                            {formatNumber(parseFloat(poolData.inputTokenWeights[index]), 2)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Providers Section */}
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Top 20 Liquidity Providers</h3>
                    {topProviders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Position</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Pool</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Deposited</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Withdrawn</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {topProviders.map((provider, index) => (
                                        <tr key={provider.address}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatAddress(provider.address)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                ${formatNumber(provider.netPosition)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                {formatNumber((provider.netPosition / parseFloat(poolData.totalValueLockedUSD)) * 100, 2)}%
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                ${formatNumber(provider.totalDeposited)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                ${formatNumber(provider.totalWithdrawn)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                {formatDate(provider.lastActive)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-gray-500 bg-gray-50 rounded p-4">
                            No liquidity provider data available for this pool yet. This might be because:
                            <ul className="list-disc ml-5 mt-2">
                                <li>The pool is new</li>
                                <li>The data is still being indexed</li>
                                <li>This pool type's data might be stored differently</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DataDisplay;