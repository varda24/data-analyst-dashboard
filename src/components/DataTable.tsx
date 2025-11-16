import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface DataTableProps {
  data: Record<string, any>[];
  columns: string[];
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
}

export default function DataTable({ data, columns, selectedColumns, onColumnsChange }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const rowsPerPage = 10;

  const filteredData = data.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const displayedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const toggleColumn = (column: string) => {
    if (selectedColumns.includes(column)) {
      if (selectedColumns.length > 1) {
        onColumnsChange(selectedColumns.filter(col => col !== column));
      }
    } else {
      onColumnsChange([...selectedColumns, column]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <h3 className="text-xl font-bold text-gray-800">Data Preview</h3>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Select Columns to Display:</p>
        <div className="flex flex-wrap gap-2">
          {columns.map(column => (
            <button
              key={column}
              onClick={() => toggleColumn(column)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                selectedColumns.includes(column)
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {column}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border-2 border-gray-200">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {selectedColumns.map(column => (
                <th
                  key={column}
                  className="text-left py-4 px-6 font-semibold text-gray-700 border-b-2 border-gray-200"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedData.map((row, index) => (
              <tr
                key={index}
                className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {selectedColumns.map(column => (
                  <td key={column} className="py-3 px-6 text-gray-700">
                    {row[column] != null ? String(row[column]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} rows
        </p>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border-2 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-4 py-2 font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border-2 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
