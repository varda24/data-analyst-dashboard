import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartsProps {
  data: Record<string, any>[];
  columns: string[];
  selectedColumns?: string[];
  chartType?: 'bar' | 'line' | 'pie' | 'heatmap' | 'boxplot';
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function Charts({ data, columns, selectedColumns, chartType: propChartType }: ChartsProps) {
  const effectiveColumns = selectedColumns || columns;
  const numericColumns = effectiveColumns.filter(col => {
    const values = data.map(row => row[col]);
    return values.some(val => typeof val === 'number' && !isNaN(val));
  });

  const [selectedXAxis, setSelectedXAxis] = useState(effectiveColumns[0] || '');
  const [selectedYAxis, setSelectedYAxis] = useState(numericColumns[0] || '');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'heatmap' | 'boxplot'>(propChartType || 'bar');

  // Update chart type when prop changes
  React.useEffect(() => {
    if (propChartType) {
      setChartType(propChartType);
    }
  }, [propChartType]);

  const prepareChartData = () => {
    if (chartType === 'pie') {
      const valueCounts = data.reduce((acc, row) => {
        const key = String(row[selectedXAxis]);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(valueCounts)
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));
    }

    const grouped = data.reduce((acc, row) => {
      const key = String(row[selectedXAxis]);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(row[selectedYAxis]);
      return acc;
    }, {} as Record<string, number[]>);

      return Object.entries(grouped)
        .slice(0, 20)
        .map(([name, values]) => ({
          name: name.length > 20 ? name.substring(0, 20) + '...' : name,
          value: (values as number[]).reduce((sum: number, val: number) => sum + (val || 0), 0) / values.length
        }));
  };

  const chartData = prepareChartData();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Interactive Visualizations</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'pie' | 'heatmap' | 'boxplot')}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="heatmap">Heatmap</option>
            <option value="boxplot">Box Plot</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">X-Axis</label>
          <select
            value={selectedXAxis}
            onChange={(e) => setSelectedXAxis(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {effectiveColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {chartType !== 'pie' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Y-Axis</label>
            <select
              value={selectedYAxis}
              onChange={(e) => setSelectedYAxis(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {numericColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-6" style={{ height: '500px' }}>
        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFF',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} name={selectedYAxis} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFF',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', r: 5 }}
                name={selectedYAxis}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFF',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {chartType === 'heatmap' && (
          <div className="w-full h-full overflow-auto">
            <div className="min-w-max">
              <div className="grid grid-cols-1 gap-2">
                {effectiveColumns.map(col => {
                  const values = data.map(row => row[col]).filter(val => val != null);
                  const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
                  if (numericValues.length === 0) return null;

                  const min = Math.min(...numericValues);
                  const max = Math.max(...numericValues);
                  const range = max - min || 1;

                  return (
                    <div key={col} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 w-24 truncate">{col}</span>
                      <div className="flex gap-1">
                        {numericValues.slice(0, 20).map((val, idx) => {
                          const intensity = (val - min) / range;
                          const color = `hsl(${240 - intensity * 240}, 70%, 50%)`;
                          return (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: color }}
                              title={`${col}: ${val}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {chartType === 'boxplot' && (
          <div className="w-full h-full overflow-auto">
            <div className="min-w-max">
              <div className="grid grid-cols-4 gap-4">
                {numericColumns.map(col => {
                  const values = data.map(row => row[col]).filter(val => typeof val === 'number' && !isNaN(val)) as number[];
                  if (values.length === 0) return null;

                  const sorted = [...values].sort((a, b) => a - b);
                  const q1 = sorted[Math.floor(sorted.length * 0.25)];
                  const median = sorted[Math.floor(sorted.length * 0.5)];
                  const q3 = sorted[Math.floor(sorted.length * 0.75)];
                  const min = sorted[0];
                  const max = sorted[sorted.length - 1];
                  const iqr = q3 - q1;
                  const lowerFence = q1 - 1.5 * iqr;
                  const upperFence = q3 + 1.5 * iqr;

                  return (
                    <div key={col} className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 truncate">{col}</h4>
                      <div className="relative h-32 flex flex-col items-center justify-center">
                        <div className="relative w-8 h-full">
                          {/* Whiskers */}
                          <div
                            className="absolute w-0.5 bg-gray-400 left-1/2 transform -translate-x-1/2"
                            style={{
                              bottom: `${((lowerFence - min) / (max - min)) * 100}%`,
                              height: `${((upperFence - lowerFence) / (max - min)) * 100}%`
                            }}
                          />
                          {/* Box */}
                          <div
                            className="absolute w-6 bg-blue-200 border-2 border-blue-400 left-1/2 transform -translate-x-1/2"
                            style={{
                              bottom: `${((q1 - min) / (max - min)) * 100}%`,
                              height: `${((q3 - q1) / (max - min)) * 100}%`
                            }}
                          />
                          {/* Median line */}
                          <div
                            className="absolute w-6 h-0.5 bg-blue-600 left-1/2 transform -translate-x-1/2"
                            style={{
                              bottom: `${((median - min) / (max - min)) * 100}%`
                            }}
                          />
                        </div>
                        <div className="flex justify-between w-full text-xs text-gray-500 mt-2">
                          <span>{min.toFixed(1)}</span>
                          <span>{q1.toFixed(1)}</span>
                          <span>{median.toFixed(1)}</span>
                          <span>{q3.toFixed(1)}</span>
                          <span>{max.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
