import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type TimeRange = '5D' | '1M' | '3M' | '6M';

interface ChartDataPoint {
  date: string;
  price: number;
}

interface StockChartProps {
  ticker: string;
}

// Simple in-memory cache to avoid hitting rate limits
const dataCache = new Map<string, { data: ChartDataPoint[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch historical data from Alpha Vantage TIME_SERIES_DAILY with caching
const fetchChartData = async (ticker: string, range: TimeRange): Promise<ChartDataPoint[]> => {
  const apiKey = import.meta.env.VITE_ALPHAVANTAGE_API_KEY;
  
  if (!apiKey) {
    console.error('Alpha Vantage API key not configured');
    return [];
  }

  // Check cache first
  const cacheKey = `${ticker}-${range}`;
  const cached = dataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached data for ${ticker} (${range})`);
    return cached.data;
  }

  // TIME_SERIES_DAILY: compact (100 days) is sufficient for 5D-6M
  const outputsize = 'compact';
  
  const avUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=${outputsize}&apikey=${apiKey}`;

  try {
    const response = await fetch(avUrl);
    if (!response.ok) {
      console.error('Alpha Vantage API error:', response.status);
      return [];
    }

    const data = await response.json();

    // Check for API errors or rate limiting
    if (data['Information']) {
      console.error('Alpha Vantage info message:', data['Information']);
      return [];
    }
    if (data['Note']) {
      console.warn('Alpha Vantage rate limit (5 req/min) hit. Please wait before trying again.', data['Note']);
      return [];
    }
    if (data['Error Message']) {
      console.error('Alpha Vantage error:', data['Error Message']);
      return [];
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries || Object.keys(timeSeries).length === 0) {
      console.warn('No time series data from Alpha Vantage for:', ticker);
      return [];
    }

    // Get all dates from the time series
    const dates = Object.keys(timeSeries).sort(); // Chronological order
    
    // Filter dates based on range
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (range) {
      case '5D':
        cutoffDate.setDate(now.getDate() - 5);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
    }

    // Build chart points and filter by date range
    const points: ChartDataPoint[] = [];
    for (const dateStr of dates) {
      const dateObj = new Date(dateStr);
      if (dateObj < cutoffDate) continue;

      const dayData = timeSeries[dateStr];
      const closePrice = parseFloat(dayData['4. close']);

      if (isNaN(closePrice)) continue;

      const label = dateObj.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit' 
      });

      points.push({
        date: label,
        price: parseFloat(closePrice.toFixed(2)),
      });
    }

    // Cache the result
    dataCache.set(cacheKey, { data: points, timestamp: Date.now() });
    
    return points;
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return [];
  }
};

export const StockChart: React.FC<StockChartProps> = ({ ticker }) => {
  const [range, setRange] = useState<TimeRange>('1M');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const chartData = await fetchChartData(ticker, range);
        if (chartData.length === 0) {
          setError('No data. Rate limited? (5 req/min). Check console.');
          setData([]);
        } else {
          setData(chartData);
        }
      } catch (err) {
        setError('Failed to load chart data');
        setData([]);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ticker, range]);

  const ranges: TimeRange[] = ['5D', '1M', '3M', '6M'];

  return (
    <div className="rounded-2xl shadow-xl p-8 mt-8 border border-gray-700/30">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-white">Price Chart</h3>
        <div className="flex gap-2 flex-wrap">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                range === r
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-white hover:bg-gray-700/80 border border-gray-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-white">Loading chart...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-400">{error}</div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 text-white">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#ffffffff', fontSize: 12 }} 
              interval={Math.max(0, Math.floor(data.length / 15) - 1)}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 5']} 
              tick={{ fill: '#ffffffff', fontSize: 12 }} 
            />
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffffff', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#60a5fa" 
              strokeWidth={3} 
              dot={false} 
              animationDuration={600} 
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};


/*  
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StockChartProps {
  ticker: string;
}

type Range = '1D' | '5D' | '1M' | '3M' | '6M';

// Toggle this to avoid intraday entirely for 1D/5D
const USE_INTRADAY_FOR_SHORT = false; // set to false to stay 100% on free daily only

type FnSpec = { fn: string; interval?: string; outputsize?: 'compact' | 'full' };

const rangeToParams: Record<Range, FnSpec> = {
  '1D': { fn: 'TIME_SERIES_DAILY', outputsize: 'compact' }, // last 100 days
  '5D': { fn: 'TIME_SERIES_DAILY', outputsize: 'compact' },
  '1M': { fn: 'TIME_SERIES_DAILY', outputsize: 'compact' },
  '3M': { fn: 'TIME_SERIES_DAILY', outputsize: 'compact' }, // compact is enough for 3M
  '6M': { fn: 'TIME_SERIES_DAILY', outputsize: 'full' },    // only use full for 6M
};


type Candle = {
  date: string;
  price: number;
};

export const StockChart: React.FC<StockChartProps> = ({ ticker }) => {
  const [range, setRange] = useState<Range>('1M');
  const [data, setData] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  const API_KEY = import.meta.env.VITE_ALPHAVANTAGE_API_KEY;

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker || !API_KEY) return;
      setLoading(true);
      setNote(null);

      const params = rangeToParams[range];
      let url = `https://www.alphavantage.co/query?function=${params.fn}&symbol=${ticker}&apikey=${API_KEY}`;
      if (params.interval) url += `&interval=${params.interval}`;
      if (params.outputsize) url += `&outputsize=${params.outputsize}`;

      try {
        const res = await fetch(url);
        const json = await res.json();

        // Handle rate limits / errors (Alpha Vantage returns "Note" or "Error Message")
        if (json['Note']) {
          console.log('Alpha Vantage Note:', json['Note']);
          setNote('Rate limited. Please wait a minute and try again.');
          setData([]);
          setLoading(false);
          return;
        }
        if (json['Error Message']) {
          console.log('Alpha Vantage Error:', json['Error Message']);
          setNote('Symbol or function error.');
          setData([]);
          setLoading(false);
          return;
        }

        // Identify correct time series key per function
        let series: Record<string, any> | undefined;
        if (params.fn === 'TIME_SERIES_INTRADAY') {
          const key = `Time Series (${params.interval})`; // e.g., "Time Series (60min)"
          series = json[key];
        } else if (params.fn === 'TIME_SERIES_DAILY') {
          series = json['Time Series (Daily)'];
        } else if (params.fn === 'TIME_SERIES_WEEKLY') {
          series = json['Weekly Time Series'];
        } else if (params.fn === 'TIME_SERIES_MONTHLY') {
          series = json['Monthly Time Series'];
        }

        if (!series) {
          setNote('No data returned (market closed or rate limit).');
          setData([]);
          setLoading(false);
          return;
        }

        // Convert to array, newest-first
        const entries = Object.entries(series) as [string, any][];

        // Date window selection (calendar days)
        const now = new Date();
        const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

        let startDate: Date;
        switch (range) {
          case '1D':
            startDate = USE_INTRADAY_FOR_SHORT ? daysAgo(1) : daysAgo(2); // intraday: 1 day; daily: last 2 dates to show
            break;
          case '5D':
            startDate = daysAgo(7); // ~5 trading days
            break;
          case '1M':
            startDate = daysAgo(31);
            break;
          case '3M':
            startDate = daysAgo(93);
            break;
          case '6M':
            startDate = daysAgo(186);
            break;
          default:
            startDate = daysAgo(31);
        }

        // Build chart points, keep only within window, and then reverse (oldest->newest)
        const chartData: Candle[] = entries
          .filter(([dateStr]) => {
            // Intraday dates include time; daily/weekly/monthly are YYYY-MM-DD
            const d = new Date(dateStr);
            return d >= startDate;
          })
          .map(([dateStr, values]) => {
            const price = parseFloat(values['4. close']);
            let label: string;
            if (params.fn === 'TIME_SERIES_INTRADAY') {
              // show HH:MM for intraday
              const time = dateStr.split(' ')[1] ?? '';
              label = time.slice(0, 5);
            } else {
              // show MM-DD for daily/weekly
              label = dateStr.slice(5, 10);
            }
            return { date: label, price };
          })
          .reverse();

        setData(chartData);
      } catch (err) {
        console.error('Fetch error:', err);
        setNote('Network error. Try again.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ticker, range, API_KEY]);

  const ranges: Range[] = ['1D', '5D', '1M', '3M', '6M'];

  return (
    <div className="rounded-2xl shadow-xl p-8 mt-8 border border-gray-700/30">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-white">Price Chart</h3>
        <div className="flex gap-2 flex-wrap">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                range === r
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-white hover:bg-gray-700/80 border border-gray-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-white">Loading chart...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 text-white">
          {note ?? 'No data (rate limit or market closed)'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: '#ffffffff', fontSize: 12 }} />
            <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fill: '#ffffffff', fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(2)}`}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffffff', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Line type="monotone" dataKey="price" stroke="#60a5fa" strokeWidth={3} dot={false} animationDuration={600} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
 */



