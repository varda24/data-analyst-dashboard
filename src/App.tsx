import { useState, useRef } from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import Statistics from './components/Statistics';
import Charts from './components/Charts';
import DataTable from './components/DataTable';
import { generatePDFReport } from './utils/pdfGenerator';

function App() {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const chartRef = useRef<HTMLDivElement>(null);

  const handleDataLoaded = (loadedData: Record<string, any>[], name: string) => {
    const cols = Object.keys(loadedData[0] || {});
    setData(loadedData);
    setColumns(cols);
    setSelectedColumns(cols);
    setFileName(name);
  };

  const handleDownloadReport = async () => {
    console.log('Download button clicked');
    if (data.length > 0) {
      console.log('Data available, starting PDF generation...');
      let chartImages: string[] = [];

      // Create temporary chart components for each type
      const chartTypes = ['bar', 'line', 'pie', 'heatmap', 'boxplot'];
      for (const type of chartTypes) {
        try {
          console.log(`Capturing ${type} chart...`);
          // We'll need to render each chart type temporarily
          // For now, capture the current chart multiple times
          if (chartRef.current) {
            const canvas = await html2canvas(chartRef.current, {
              backgroundColor: '#ffffff',
              scale: 2,
              useCORS: true,
              allowTaint: true,
            });
            chartImages.push(canvas.toDataURL('image/png'));
          }
        } catch (error) {
          console.error(`Error capturing ${type} chart:`, error);
        }
      }

      try {
        console.log('Generating PDF report...');
        generatePDFReport(data, selectedColumns, fileName, chartImages);
        console.log('PDF report generated successfully');
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF report. Please check the console for details.');
      }
    } else {
      console.log('No data available for PDF generation');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      <Header />

      <main className="container mx-auto px-6 py-8">
        {data.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Transform Your Data Into Insights
              </h2>
              <p className="text-lg text-gray-600">
                Upload your CSV file and get instant analytics, visualizations, and professional reports
              </p>
            </div>

            <FileUpload onDataLoaded={handleDataLoaded} />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Instant Statistics</h3>
                <p className="text-gray-600 text-sm">
                  Get comprehensive statistical analysis including mean, median, and missing value detection
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Interactive Charts</h3>
                <p className="text-gray-600 text-sm">
                  Create beautiful bar, line, and pie charts with customizable axes and filters
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">PDF Reports</h3>
                <p className="text-gray-600 text-sm">
                  Download professional reports with all your insights in a polished format
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Analysis Results</h2>
                <p className="text-gray-600 mt-1">Dataset: {fileName}</p>
              </div>
              <button
                onClick={handleDownloadReport}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF Report</span>
              </button>
            </div>

            <Statistics data={data} columns={selectedColumns} />

            <div ref={chartRef}>
              <Charts data={data} columns={selectedColumns} />
            </div>

            <DataTable data={data} columns={columns} selectedColumns={selectedColumns} onColumnsChange={setSelectedColumns} />

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setData([]);
                  setColumns([]);
                  setFileName('');
                }}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all shadow-md"
              >
                Upload New Dataset
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-6 py-6">
          <p className="text-center text-gray-600 text-sm">
            DataViz Pro - Professional Data Analytics Dashboard
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
