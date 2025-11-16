import { TrendingUp, Database, Layers, AlertCircle } from 'lucide-react';

interface StatisticsProps {
  data: Record<string, any>[];
  columns: string[];
}

export default function Statistics({ data, columns }: StatisticsProps) {
  const calculateStats = (column: string) => {
    const values = data.map(row => row[column]).filter(val => val != null && val !== '');
    const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));

    if (numericValues.length === 0) {
      return {
        type: 'categorical',
        unique: new Set(values).size,
        missing: data.length - values.length,
        mostCommon: getMostCommon(values)
      };
    }

    const sorted = [...numericValues].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = sum / sorted.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    // Calculate mode
    const counts = numericValues.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    const mode = Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];

    return {
      type: 'numeric',
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      min: Math.min(...sorted).toFixed(2),
      max: Math.max(...sorted).toFixed(2),
      sum: sum.toFixed(2),
      mode: mode,
      missing: data.length - values.length
    };
  };

  const getMostCommon = (values: any[]) => {
    const counts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'N/A';
  };

  const totalMissing = columns.reduce((acc, col) => {
    const values = data.map(row => row[col]).filter(val => val != null && val !== '');
    return acc + (data.length - values.length);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Rows</p>
              <p className="text-3xl font-bold mt-2">{data.length.toLocaleString()}</p>
            </div>
            <Database className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Columns</p>
              <p className="text-3xl font-bold mt-2">{columns.length}</p>
            </div>
            <Layers className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Data Points</p>
              <p className="text-3xl font-bold mt-2">{(data.length * columns.length).toLocaleString()}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Missing Values</p>
              <p className="text-3xl font-bold mt-2">{totalMissing}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Column Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Column</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Details</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Missing</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((column, index) => {
                const stats = calculateStats(column);
                return (
                  <tr
                    key={column}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <td className="py-4 px-4 font-medium text-gray-800">{column}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        stats.type === 'numeric'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {stats.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {stats.type === 'numeric' ? (
                        <div className="text-sm space-y-1">
                          <div>Mean: {stats.mean}</div>
                          <div>Median: {stats.median}</div>
                          <div>Mode: {stats.mode}</div>
                          <div>Sum: {stats.sum}</div>
                          <div>Range: {stats.min} - {stats.max}</div>
                        </div>
                      ) : (
                        <div className="text-sm space-y-1">
                          <div>Unique: {stats.unique}</div>
                          <div>Most common: {stats.mostCommon}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-medium ${stats.missing > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {stats.missing}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
