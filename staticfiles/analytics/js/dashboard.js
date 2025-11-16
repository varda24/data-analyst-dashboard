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
            `;
            feather.replace();
        },

        initializeCharts() {
            const ctx = document.getElementById('chart').getContext('2d');
            if (this.chart) {
                this.chart.destroy();
            }

            // Initialize chart selects
            const xAxisSelect = document.getElementById('x-axis');
            const yAxisSelect = document.getElementById('y-axis');
            xAxisSelect.innerHTML = '';
            yAxisSelect.innerHTML = '';

            this.dataset.columns.forEach(column => {
                xAxisSelect.add(new Option(column, column));
                if (this.statistics.column_stats[column].type === 'numeric') {
                    yAxisSelect.add(new Option(column, column));
                }
            });

            this.updateChart();

            // Add event listeners
            document.getElementById('chart-type').addEventListener('change', () => this.updateChart());
            xAxisSelect.addEventListener('change', () => this.updateChart());
            yAxisSelect.addEventListener('change', () => this.updateChart());
        },

        updateChart() {
            const chartType = document.getElementById('chart-type').value;
            const xAxis = document.getElementById('x-axis').value;
            const yAxis = document.getElementById('y-axis').value;

            // Prepare data based on chart type
            let chartData;
            if (chartType === 'pie') {
                const counts = {};
                this.dataset.data.forEach(row => {
                    const key = String(row[xAxis]);
                    counts[key] = (counts[key] || 0) + 1;
                });
                chartData = {
                    labels: Object.keys(counts),
                    datasets: [{
                        data: Object.values(counts),
                        backgroundColor: [
                            '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                            '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
                        ]
                    }]
                };
            } else {
                const grouped = {};
                this.dataset.data.forEach(row => {
                    const key = String(row[xAxis]);
                    if (!grouped[key]) grouped[key] = [];
                    if (row[yAxis] != null) grouped[key].push(Number(row[yAxis]));
                });

                const labels = Object.keys(grouped);
                const data = labels.map(key => {
                    const values = grouped[key];
                    return values.length ? values.reduce((a, b) => a + b) / values.length : 0;
                });

                chartData = {
                    labels,
                    datasets: [{
                        label: yAxis,
                        data,
                        backgroundColor: '#3B82F6',
                        borderColor: '#3B82F6'
                    }]
                };
            }

            // Create chart
            const ctx = document.getElementById('chart').getContext('2d');
            if (this.chart) {
                this.chart.destroy();
            }

            this.chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    }
                }
            });
        },

        initializeDataTable() {
            const table = document.getElementById('data-table');
            table.innerHTML = `
                <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                        ${this.dataset.columns.map(col => `
                            <th class="text-left py-4 px-6 font-semibold text-gray-700 border-b-2 border-gray-200">
                                ${col}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${this.dataset.data.slice(0, this.rowsPerPage).map((row, index) => `
                        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors">
                            ${this.dataset.columns.map(col => `
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
                    ${this.dataset.columns.map(col => `
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