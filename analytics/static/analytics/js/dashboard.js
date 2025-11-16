new Vue({
    el: '#app',
    delimiters: ['[[', ']]'],
    data: {
        dataset: null,
        statistics: null,
        chart: null,
        dataTable: null,
        searchTerm: '',
        selectedColumns: [],
        currentPage: 1,
        rowsPerPage: 10
    },
    methods: {
        async handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/analytics/upload/', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Upload failed');

                const result = await response.json();
                this.dataset = result;
                await this.loadDataset(result.id);
                await this.loadStatistics(result.id);
                this.initializeCharts();
            } catch (error) {
                console.error('Error uploading file:', error);
                alert('Error uploading file. Please try again.');
            }
        },

        async loadDataset(id) {
            try {
                const response = await fetch(`/analytics/dataset/${id}/`);
                if (!response.ok) throw new Error('Failed to load dataset');
                
                const result = await response.json();
                this.dataset = result;
                this.selectedColumns = [...result.columns];
                this.initializeDataTable();
            } catch (error) {
                console.error('Error loading dataset:', error);
            }
        },

        async loadStatistics(id) {
            try {
                const response = await fetch(`/analytics/dataset/${id}/statistics/`);
                if (!response.ok) throw new Error('Failed to load statistics');
                
                const result = await response.json();
                this.statistics = result;
                this.updateStatisticsUI();
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        },

        updateStatisticsUI() {
            if (!this.statistics) return;

            const statsSection = document.getElementById('statistics-section');
            statsSection.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-blue-100 text-sm font-medium">Total Rows</p>
                                <p class="text-3xl font-bold mt-2">${this.statistics.total_rows.toLocaleString()}</p>
                            </div>
                            <i data-feather="database" class="w-12 h-12 text-blue-200"></i>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-purple-100 text-sm font-medium">Total Columns</p>
                                <p class="text-3xl font-bold mt-2">${this.statistics.total_columns}</p>
                            </div>
                            <i data-feather="layers" class="w-12 h-12 text-purple-200"></i>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-green-100 text-sm font-medium">Data Points</p>
                                <p class="text-3xl font-bold mt-2">${(this.statistics.total_rows * this.statistics.total_columns).toLocaleString()}</p>
                            </div>
                            <i data-feather="trending-up" class="w-12 h-12 text-green-200"></i>
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-orange-100 text-sm font-medium">Missing Values</p>
                                <p class="text-3xl font-bold mt-2">${this.statistics.total_missing}</p>
                            </div>
                            <i data-feather="alert-circle" class="w-12 h-12 text-orange-200"></i>
                        </div>
                    </div>
                </div>

                <!-- Detailed Column Statistics -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-6">Column Statistics</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Column</th>
                                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Mean</th>
                                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Median</th>
                                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Mode</th>
                                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Min</th>
                                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Max</th>
                                    <th class="text-left py-3 px-4 font-semibold text-gray-700">Missing</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(this.statistics.column_stats).map(([col, stats], index) => `
                                    <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                                        <td class="py-3 px-4 text-gray-700 font-medium">${col}</td>
                                        <td class="py-3 px-4 text-gray-700">
                                            <span class="px-2 py-1 rounded-full text-xs font-medium ${
                                                stats.type === 'numeric' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                            }">
                                                ${stats.type}
                                            </span>
                                        </td>
                                        <td class="py-3 px-4 text-gray-700">${stats.mean !== undefined ? stats.mean.toFixed(2) : '-'}</td>
                                        <td class="py-3 px-4 text-gray-700">${stats.median !== undefined ? stats.median.toFixed(2) : '-'}</td>
                                        <td class="py-3 px-4 text-gray-700">
                                            ${stats.mode !== null ? (stats.mode_count > 1 ? `${stats.mode} (${stats.mode_count} modes)` : stats.mode) : '-'}
                                        </td>
                                        <td class="py-3 px-4 text-gray-700">${stats.min !== undefined && stats.min !== null ? (stats.type === 'numeric' ? stats.min.toFixed(2) : stats.min) : '-'}</td>
                                        <td class="py-3 px-4 text-gray-700">${stats.max !== undefined && stats.max !== null ? (stats.type === 'numeric' ? stats.max.toFixed(2) : stats.max) : '-'}</td>
                                        <td class="py-3 px-4 text-gray-700">${stats.missing}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            feather.replace();
        },

        initializeCharts() {
            const ctx = document.getElementById('chart').getContext('2d');
            if (this.chart) {
                this.chart.destroy();
            }

            // Initialize column selection checkboxes
            this.initializeColumnSelection();

            // Initialize chart selects
            const xAxisSelect = document.getElementById('x-axis');
            const yAxisSelect = document.getElementById('y-axis');
            const zAxisSelect = document.getElementById('z-axis');
            xAxisSelect.innerHTML = '';
            yAxisSelect.innerHTML = '';
            zAxisSelect.innerHTML = '';

            this.dataset.columns.forEach(column => {
                xAxisSelect.add(new Option(column, column));
                if (this.statistics.column_stats[column].type === 'numeric') {
                    yAxisSelect.add(new Option(column, column));
                    zAxisSelect.add(new Option(column, column));
                }
            });

            // Choose sensible defaults so charts render correctly
            if (xAxisSelect.options.length > 0) {
                xAxisSelect.value = xAxisSelect.options[0].value;
            }
            if (yAxisSelect.options.length > 0) {
                yAxisSelect.value = yAxisSelect.options[0].value;
            }

            this.updateChart();

            // Add event listeners
            document.getElementById('chart-type').addEventListener('change', () => this.updateChart());
            xAxisSelect.addEventListener('change', () => this.updateChart());
            yAxisSelect.addEventListener('change', () => this.updateChart());
            zAxisSelect.addEventListener('change', () => this.updateChart());
        },

        initializeColumnSelection() {
            const columnSelectionDiv = document.getElementById('column-selection');
            columnSelectionDiv.innerHTML = '';

            this.dataset.columns.forEach(column => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'flex items-center space-x-2';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `col-${column}`;
                checkbox.value = column;
                checkbox.checked = this.selectedColumns.includes(column);
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.selectedColumns.push(column);
                    } else {
                        this.selectedColumns = this.selectedColumns.filter(c => c !== column);
                    }
                    this.updateDataTable();
                });

                const label = document.createElement('label');
                label.htmlFor = `col-${column}`;
                label.className = 'text-sm text-gray-700 cursor-pointer';
                label.textContent = column;

                checkboxDiv.appendChild(checkbox);
                checkboxDiv.appendChild(label);
                columnSelectionDiv.appendChild(checkboxDiv);
            });
        },

        updateChart() {
            const chartType = document.getElementById('chart-type').value;
            const xAxisEl = document.getElementById('x-axis');
            const yAxisEl = document.getElementById('y-axis');
            const zAxisEl = document.getElementById('z-axis');

            // Show/hide Z-axis based on chart type
            if (chartType === 'scatter') {
                zAxisEl.style.display = 'block';
            } else {
                zAxisEl.style.display = 'none';
            }

            // Fallbacks in case values are empty
            const xAxis = xAxisEl.value || (xAxisEl.options[0] && xAxisEl.options[0].value) || this.dataset.columns[0];

            // For Y axis prefer a numeric column; fall back to first numeric column if not selected
            let yAxis = yAxisEl.value;
            if (!yAxis) {
                const numericCol = this.dataset.columns.find(c => this.statistics.column_stats[c] && this.statistics.column_stats[c].type === 'numeric');
                yAxis = numericCol || this.dataset.columns[0];
                if (yAxisEl.options.length > 0) yAxisEl.value = yAxis;
            }

            // Prepare data based on chart type
            let chartData;
            if (chartType === 'pie') {
                const counts = {};
                this.dataset.data.forEach(row => {
                    const key = row[xAxis] != null ? String(row[xAxis]) : 'Undefined';
                    counts[key] = (counts[key] || 0) + 1;
                });

                // Sort categories by count and limit to top 8, group the rest into "Other"
                const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                const top = entries.slice(0, 8);
                const others = entries.slice(8);
                const otherSum = others.reduce((s, e) => s + e[1], 0);

                const labels = top.map(e => e[0]);
                const data = top.map(e => e[1]);
                if (otherSum > 0) {
                    labels.push('Other');
                    data.push(otherSum);
                }

                chartData = {
                    labels,
                    datasets: [{
                        data,
                        backgroundColor: [
                            '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                            '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#94A3B8'
                        ]
                    }]
                };
            } else if (chartType === 'scatter') {
                const zAxis = zAxisEl.value || yAxis;
                const data = this.dataset.data.filter(row => {
                    const xVal = Number(row[xAxis]);
                    const yVal = Number(row[yAxis]);
                    const zVal = Number(row[zAxis]);
                    return !isNaN(xVal) && !isNaN(yVal) && !isNaN(zVal);
                }).map(row => ({
                    x: Number(row[xAxis]),
                    y: Number(row[yAxis]),
                    z: Number(row[zAxis])
                }));

                chartData = {
                    datasets: [{
                        label: `${xAxis} vs ${yAxis}`,
                        data: data,
                        backgroundColor: '#3B82F6',
                        borderColor: '#1E40AF'
                    }]
                };
            } else if (chartType === 'histogram') {
                const values = this.dataset.data.map(row => Number(row[yAxis])).filter(val => !isNaN(val));
                const min = Math.min(...values);
                const max = Math.max(...values);
                const binCount = 10;
                const binSize = (max - min) / binCount;

                const bins = Array.from({length: binCount}, (_, i) => ({
                    min: min + i * binSize,
                    max: min + (i + 1) * binSize,
                    count: 0
                }));

                values.forEach(val => {
                    const binIndex = Math.min(Math.floor((val - min) / binSize), binCount - 1);
                    bins[binIndex].count++;
                });

                const labels = bins.map(bin => `${bin.min.toFixed(1)}-${bin.max.toFixed(1)}`);
                const data = bins.map(bin => bin.count);

                chartData = {
                    labels,
                    datasets: [{
                        label: `Frequency of ${yAxis}`,
                        data,
                        backgroundColor: '#3B82F6',
                        borderColor: '#1E40AF'
                    }]
                };
            } else if (chartType === 'boxplot') {
                // For box plot, we'll show summary statistics
                const values = this.dataset.data.map(row => Number(row[yAxis])).filter(val => !isNaN(val)).sort((a, b) => a - b);
                const q1 = values[Math.floor(values.length * 0.25)];
                const median = values[Math.floor(values.length * 0.5)];
                const q3 = values[Math.floor(values.length * 0.75)];
                const iqr = q3 - q1;
                const min = Math.max(values[0], q1 - 1.5 * iqr);
                const max = Math.min(values[values.length - 1], q3 + 1.5 * iqr);

                chartData = {
                    labels: [yAxis],
                    datasets: [{
                        label: 'Box Plot',
                        data: [{
                            min: min,
                            q1: q1,
                            median: median,
                            q3: q3,
                            max: max
                        }],
                        backgroundColor: '#3B82F6',
                        borderColor: '#1E40AF'
                    }]
                };
            } else if (chartType === 'heatmap') {
                // Correlation heatmap for numeric columns
                const numericCols = this.dataset.columns.filter(col =>
                    this.statistics.column_stats[col] && this.statistics.column_stats[col].type === 'numeric'
                );

                if (numericCols.length < 2) {
                    chartData = {
                        labels: ['Insufficient numeric columns for correlation'],
                        datasets: [{
                            label: 'No Data',
                            data: [0],
                            backgroundColor: '#E5E7EB'
                        }]
                    };
                } else {
                    // Calculate correlation matrix
                    const corrMatrix = [];
                    for (let i = 0; i < numericCols.length; i++) {
                        corrMatrix[i] = [];
                        for (let j = 0; j < numericCols.length; j++) {
                            if (i === j) {
                                corrMatrix[i][j] = 1; // Perfect correlation with itself
                            } else {
                                const col1 = numericCols[i];
                                const col2 = numericCols[j];
                                const values1 = this.dataset.data.map(row => Number(row[col1])).filter(val => !isNaN(val));
                                const values2 = this.dataset.data.map(row => Number(row[col2])).filter(val => !isNaN(val));

                                // Calculate Pearson correlation coefficient
                                const n = Math.min(values1.length, values2.length);
                                if (n < 2) {
                                    corrMatrix[i][j] = 0;
                                } else {
                                    const sum1 = values1.slice(0, n).reduce((a, b) => a + b, 0);
                                    const sum2 = values2.slice(0, n).reduce((a, b) => a + b, 0);
                                    const sum1Sq = values1.slice(0, n).reduce((a, b) => a + b * b, 0);
                                    const sum2Sq = values2.slice(0, n).reduce((a, b) => a + b * b, 0);
                                    const sumProd = values1.slice(0, n).reduce((a, b, idx) => a + b * values2[idx], 0);

                                    const numerator = n * sumProd - sum1 * sum2;
                                    const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));

                                    corrMatrix[i][j] = denominator === 0 ? 0 : numerator / denominator;
                                }
                            }
                        }
                    }

                    // Flatten correlation matrix for chart data
                    const data = [];
                    const labels = [];
                    for (let i = 0; i < numericCols.length; i++) {
                        for (let j = 0; j < numericCols.length; j++) {
                            data.push(corrMatrix[i][j]);
                            labels.push(`${numericCols[i]} vs ${numericCols[j]}`);
                        }
                    }

                    chartData = {
                        labels: numericCols,
                        datasets: [{
                            label: 'Correlation',
                            data: corrMatrix.flat(),
                            backgroundColor: (context) => {
                                const value = context.parsed.y;
                                if (value > 0.7) return '#DC2626'; // Strong positive - red
                                if (value > 0.3) return '#F59E0B'; // Moderate positive - orange
                                if (value > -0.3) return '#E5E7EB'; // Weak - gray
                                if (value > -0.7) return '#3B82F6'; // Moderate negative - blue
                                return '#1E40AF'; // Strong negative - dark blue
                            },
                            borderColor: '#FFFFFF',
                            borderWidth: 1
                        }]
                    };
                }
            } else {
                // Bar and Line charts
                const grouped = {};
                this.dataset.data.forEach(row => {
                    const key = row[xAxis] != null ? String(row[xAxis]) : 'Undefined';
                    if (!grouped[key]) grouped[key] = [];
                    const raw = row[yAxis];
                    const num = Number(raw);
                    if (raw != null && !Number.isNaN(num) && Number.isFinite(num)) {
                        grouped[key].push(num);
                    }
                });

                // Convert grouped to averaged values, sort by value desc and take top 20 for readability
                const entries = Object.entries(grouped).map(([k, vals]) => {
                    const agg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    return [k, agg];
                }).sort((a, b) => b[1] - a[1]).slice(0, 20);

                const labels = entries.map(e => e[0]);
                const data = entries.map(e => Number(e[1].toFixed(2)));

                chartData = {
                    labels,
                    datasets: [{
                        label: yAxis,
                        data,
                        backgroundColor: labels.map((_, i) => {
                            // Slight color variation for bars
                            const base = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];
                            return base[i % base.length];
                        }),
                        borderColor: '#1E40AF'
                    }]
                };
            }

            // Create chart
            const ctx = document.getElementById('chart').getContext('2d');
            if (this.chart) {
                this.chart.destroy();
            }

            this.chart = new Chart(ctx, {
                type: chartType === 'boxplot' ? 'bar' : chartType, // Chart.js doesn't have built-in boxplot, using bar as placeholder
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: chartType === 'scatter' ? {
                        x: {
                            type: 'linear',
                            position: 'bottom'
                        },
                        y: {
                            type: 'linear'
                        }
                    } : {}
                }
            });
        },

        initializeDataTable() {
            const table = document.getElementById('data-table');
            table.innerHTML = `
                <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                        ${this.selectedColumns.map(col => `
                            <th class="text-left py-4 px-6 font-semibold text-gray-700 border-b-2 border-gray-200">
                                ${col}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${this.dataset.data.slice(0, this.rowsPerPage).map((row, index) => `
                        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors">
                            ${this.selectedColumns.map(col => `
                                <td class="py-3 px-6 text-gray-700">
                                    ${row[col] != null ? String(row[col]) : '-'}
                                </td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            `;

            // Add search functionality
            document.getElementById('search-input').addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.updateDataTable();
            });
        },

        updateDataTable() {
            const filteredData = this.dataset.data.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(this.searchTerm)
                )
            );

            const startIndex = (this.currentPage - 1) * this.rowsPerPage;
            const displayedData = filteredData.slice(startIndex, startIndex + this.rowsPerPage);

            const tbody = document.querySelector('#data-table tbody');
            tbody.innerHTML = displayedData.map((row, index) => `
                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors">
                    ${this.selectedColumns.map(col => `
                        <td class="py-3 px-6 text-gray-700">
                            ${row[col] != null ? String(row[col]) : '-'}
                        </td>
                    `).join('')}
                </tr>
            `).join('');
        },

        async generateReport() {
            if (!this.dataset) return;

            try {
                window.location.href = `/analytics/dataset/${this.dataset.id}/report/`;
            } catch (error) {
                console.error('Error generating report:', error);
                alert('Error generating report. Please try again.');
            }
        },

        resetDataset() {
            this.dataset = null;
            this.statistics = null;
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
        }
    }
});