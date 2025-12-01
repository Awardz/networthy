import React, { useState, useEffect } from 'react';
import axios from 'axios';


interface Stock {
    ticker: string;
    name: string;
}

interface StockSearchProps {
    onStockSelect: (stock: { ticker: string; name: string }) => void;
}

export const StockSearch: React.FC<StockSearchProps> = ({ onStockSelect }) => {
    const [query, setQuery] = useState('');
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (query.trim().length < 1) {
            setStocks([]);
            setIsOpen(false);
            return;
        }

        const fetchStocks = async () => {
            try {
                const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
                const response = await axios.get(
                    `https://finnhub.io/api/v1/search?q=${query}&token=${apiKey}`
                );
                
                if (response.data.result) {
                    const stocks = response.data.result.slice(0, 5).map((item: any) => ({
                        ticker: item.symbol,
                        name: item.description,
                    }));
                    setStocks(stocks);
                    setIsOpen(stocks.length > 0);
                }
            } catch (error) {
                console.error('Error fetching stocks:', error);
                // Fallback to mock data on error
                const mockStocks: Stock[] = [
                    { ticker: 'AAPL', name: 'Apple Inc.' },
                    { ticker: 'GOOGL', name: 'Alphabet Inc.' },
                    { ticker: 'MSFT', name: 'Microsoft Corporation' },
                ];
                const filtered = mockStocks.filter(
                    (stock) =>
                        stock.ticker.toLowerCase().includes(query.toLowerCase()) ||
                        stock.name.toLowerCase().includes(query.toLowerCase())
                );
                setStocks(filtered);
                setIsOpen(filtered.length > 0);
            }
        };

        fetchStocks();
    }, [query]);

    return (
        <div className="w-full px-4 py-6 bg-gray-50 border-b">
            <div className="relative max-w-4xl mx-auto">
                <input
                    type="text"
                    placeholder="Search stocks by ticker or company name..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {isOpen && stocks.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                        {stocks.map((stock) => (
                            <button
                                key={stock.ticker}
                                onClick={() => {
                                    setIsOpen(false);
                                    setStocks([]);
                                    onStockSelect(stock);
                                    setQuery('');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                            >
                                <div className="font-semibold">{stock.ticker}</div>
                                <div className="text-sm text-gray-600">{stock.name}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};