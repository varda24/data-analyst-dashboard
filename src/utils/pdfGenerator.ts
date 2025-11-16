import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatColumnName = (name: string) => {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
};

const generateBarChart = (doc: jsPDF, data: any[], x: number, y: number, width: number, height: number) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = width / data.length * 0.8;
  const spacing = width / data.length * 0.2;

  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * height;
    const barX = x + index * (barWidth + spacing);
    const barY = y + height - barHeight;

    // Draw bar
    doc.setFillColor(59, 130, 246);
    doc.rect(barX, barY, barWidth, barHeight, 'F');

    // Draw label
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const label = item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name;
    doc.text(label, barX + barWidth/2, y + height + 8, { align: 'center' });

    // Draw value
    doc.text(item.value.toFixed(1), barX + barWidth/2, barY - 2, { align: 'center' });
  });
};

const generateLineChart = (doc: jsPDF, data: any[], x: number, y: number, width: number, height: number) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  const pointSpacing = width / (data.length - 1);

  // Draw line
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(2);

  data.forEach((item, index) => {
    if (index < data.length - 1) {
      const x1 = x + index * pointSpacing;
      const y1 = y + height - ((item.value - minValue) / range) * height;
      const x2 = x + (index + 1) * pointSpacing;
      const y2 = y + height - ((data[index + 1].value - minValue) / range) * height;

      doc.line(x1, y1, x2, y2);
    }

    // Draw point
    const pointX = x + index * pointSpacing;
    const pointY = y + height - ((item.value - minValue) / range) * height;
    doc.setFillColor(59, 130, 246);
    doc.circle(pointX, pointY, 2, 'F');
  });

  // Draw labels
  data.forEach((item, index) => {
    const labelX = x + index * pointSpacing;
    const label = item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name;
    doc.setFontSize(7);
    doc.text(label, labelX, y + height + 8, { align: 'center' });
  });
};

const generatePieChart = (doc: jsPDF, data: any[], x: number, y: number, radius: number) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  const colors = [
    [59, 130, 246], [16, 185, 129], [245, 158, 11], [239, 68, 68],
    [139, 92, 246], [236, 72, 153], [20, 184, 166], [249, 115, 22]
  ];

  data.forEach((item, index) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Draw pie slice using approximated arc
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    doc.setFillColor(colors[index % colors.length][0], colors[index % colors.length][1], colors[index % colors.length][2]);
    doc.moveTo(x, y);
    doc.lineTo(x + radius * Math.cos(startAngleRad), y + radius * Math.sin(startAngleRad));
    for (let angle = startAngleRad; angle <= endAngleRad; angle += Math.PI / 180) {
      doc.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
    }
    doc.lineTo(x, y);
    doc.fill();

    // Draw label
    const labelAngle = (startAngle + angle / 2) * Math.PI / 180;
    const labelRadius = radius + 15;
    const labelX = x + Math.cos(labelAngle) * labelRadius;
    const labelY = y + Math.sin(labelAngle) * labelRadius;

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const label = `${item.name}: ${item.value}`;
    doc.text(label, labelX, labelY, { align: 'center' });

    currentAngle = endAngle;
  });
};

const generateHeatmap = (doc: jsPDF, data: Record<string, any>[], columns: string[], x: number, y: number, width: number, height: number) => {
  const numericColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(val => val != null);
    return values.some(val => typeof val === 'number' && !isNaN(val));
  });

  const cellWidth = width / 20;
  const cellHeight = height / numericColumns.length;

  numericColumns.forEach((col, colIndex) => {
    const values = data.map(row => row[col]).filter(val => typeof val === 'number' && !isNaN(val)) as number[];
    if (values.length === 0) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Column label
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const label = col.length > 15 ? col.substring(0, 15) + '...' : col;
    doc.text(label, x - 5, y + colIndex * cellHeight + cellHeight / 2 + 3, { align: 'right' });

    // Heatmap cells
    values.slice(0, 20).forEach((val, valIndex) => {
      const intensity = (val - min) / range;
      const color = [
        Math.round(240 - intensity * 240), // R
        Math.round(240 - intensity * 120), // G
        Math.round(255) // B
      ];

      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(x + valIndex * cellWidth, y + colIndex * cellHeight, cellWidth - 1, cellHeight - 1, 'F');
    });
  });
};

const generateBoxPlot = (doc: jsPDF, data: Record<string, any>[], columns: string[], x: number, y: number, width: number, height: number) => {
  const numericColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(val => val != null);
    return values.some(val => typeof val === 'number' && !isNaN(val));
  });

  const plotWidth = width / numericColumns.length;

  numericColumns.forEach((col, index) => {
    const values = data.map(row => row[col]).filter(val => typeof val === 'number' && !isNaN(val)) as number[];
    if (values.length === 0) return;

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const median = sorted[Math.floor(sorted.length * 0.5)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    const plotX = x + index * plotWidth;
    const plotCenter = plotX + plotWidth / 2;

    // Draw box
    doc.setFillColor(59, 130, 246);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.rect(plotCenter - 8, y + height - ((q3 - min) / (max - min)) * height, 16, ((q3 - q1) / (max - min)) * height, 'FD');

    // Draw median line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.line(plotCenter - 8, y + height - ((median - min) / (max - min)) * height, plotCenter + 8, y + height - ((median - min) / (max - min)) * height);

    // Draw whiskers
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(plotCenter, y + height - ((q3 - min) / (max - min)) * height, plotCenter, y + height - ((max - min) / (max - min)) * height);
    doc.line(plotCenter, y + height - ((q1 - min) / (max - min)) * height, plotCenter, y);

    // Draw whisker caps
    doc.line(plotCenter - 3, y + height, plotCenter + 3, y + height);
    doc.line(plotCenter - 3, y, plotCenter + 3, y);

    // Column label
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const label = col.length > 10 ? col.substring(0, 10) + '...' : col;
    doc.text(label, plotCenter, y + height + 10, { align: 'center' });
  });
};

export const generatePDFReport = (
  data: Record<string, any>[],
  columns: string[],
  fileName: string,
  chartImages?: string[]
) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  doc.text('DataViz Pro - Analysis Report', 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Dataset: ${fileName}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  let currentY = 50;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary Statistics', 14, currentY);

  const summaryData = [
    ['Total Rows', data.length.toLocaleString()],
    ['Total Columns', columns.length.toString()],
    ['Data Points', (data.length * columns.length).toLocaleString()]
  ];

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 11, fontStyle: 'bold' },
    styles: { fontSize: 10 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  const calculateColumnStats = (column: string) => {
    const values = data.map(row => row[column]).filter(val => val != null && val !== '');
    const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));

    if (numericValues.length === 0) {
      const unique = new Set(values).size;
      const mostCommon = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mode = Object.entries(mostCommon).reduce((a, b) => mostCommon[a[0]] > mostCommon[b[0]] ? a : b)[0];
      return {
        type: 'Categorical',
        details: `Unique: ${unique}, Mode: ${mode}`,
        missing: data.length - values.length
      };
    }

    const sorted = [...numericValues].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = (sum / sorted.length).toFixed(2);
    const median = sorted.length % 2 === 0
      ? ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(2)
      : sorted[Math.floor(sorted.length / 2)].toFixed(2);
    const min = Math.min(...sorted).toFixed(2);
    const max = Math.max(...sorted).toFixed(2);

    // Calculate mode
    const counts = numericValues.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    const mode = Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];

    return {
      type: 'Numeric',
      details: `Min: ${min}, Max: ${max}, Mean: ${mean}, Median: ${median}, Mode: ${mode}, Sum: ${sum.toFixed(2)}`,
      missing: data.length - values.length
    };
  };

  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.text('Column Analysis', 14, currentY);

  const columnData = columns.map(col => {
    const stats = calculateColumnStats(col);
    return [formatColumnName(col), stats.type, stats.details, stats.missing.toString()];
  });

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Column', 'Type', 'Statistics', 'Missing']],
    body: columnData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.text('Data Sample (First 10 Rows)', 14, currentY);

  const sampleData = data.slice(0, 10).map(row =>
    columns.map(col => {
      const val = row[col];
      return val != null ? String(val).substring(0, 30) : '-';
    })
  );

  autoTable(doc, {
    startY: currentY + 5,
    head: [columns.map(col => formatColumnName(col))],
    body: sampleData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: columns.reduce((acc, _, index) => {
      acc[index] = { cellWidth: 'auto' };
      return acc;
    }, {} as any)
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Add Visualizations section - Generate actual charts using functions
  const chartTypes = ['Bar Chart', 'Line Chart', 'Pie Chart', 'Heatmap'];
  const numericColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(val => val != null);
    return values.some(val => typeof val === 'number' && !isNaN(val));
  });

  // Prepare chart data
  const barLineData = (() => {
    if (numericColumns.length === 0) return [];
    const xCol = columns[0];
    const yCol = numericColumns[0];

    const grouped = data.reduce((acc, row) => {
      const key = String(row[xCol]);
      if (!acc[key]) acc[key] = [];
      acc[key].push(row[yCol]);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(grouped)
      .slice(0, 10)
      .map(([name, values]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        value: (values as number[]).reduce((sum, val) => sum + (val || 0), 0) / values.length
      }));
  })();

  const pieData = (() => {
    const xCol = columns[0];
    const valueCounts = data.reduce((acc, row) => {
      const key = String(row[xCol]);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(valueCounts)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  })();

  chartTypes.forEach((chartType, index) => {
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    try {
      if (chartType === 'Bar Chart' && barLineData.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(chartType, 14, currentY);
        generateBarChart(doc, barLineData, 14, currentY + 5, 180, 70);
        currentY += 90;
      } else if (chartType === 'Line Chart' && barLineData.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(chartType, 14, currentY);
        generateLineChart(doc, barLineData, 14, currentY + 5, 180, 70);
        currentY += 90;
      } else if (chartType === 'Pie Chart' && pieData.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(chartType, 14, currentY);
        generatePieChart(doc, pieData, 100, currentY + 45, 35);
        currentY += 90;
      } else if (chartType === 'Heatmap') {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(chartType, 14, currentY);
        generateHeatmap(doc, data, columns, 40, currentY + 5, 160, 70);
        currentY += 90;
      }
    } catch (error) {
      console.error(`Error generating ${chartType}:`, error);
      // Skip this visualization entirely if there's an error
    }
  });

  // Add Summary section
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', 14, currentY);

  const totalMissing = columns.reduce((acc, col) => {
    const values = data.map(row => row[col]).filter(val => val != null && val !== '');
    return acc + (data.length - values.length);
  }, 0);

  const summaryText = [
    `This dataset contains ${data.length.toLocaleString()} rows and ${columns.length} columns, resulting in ${(data.length * columns.length).toLocaleString()} data points.`,
    `There are ${numericColumns.length} numeric columns and ${columns.length - numericColumns.length} categorical columns.`,
    `Total missing values: ${totalMissing} (${((totalMissing / (data.length * columns.length)) * 100).toFixed(1)}%).`,
    `The analysis includes comprehensive statistics for each column, including min, max, mean, median, mode, and sum for numeric data.`,
    `Visualizations have been generated to help understand the data distribution and relationships.`
  ];

  doc.setFontSize(10);
  summaryText.forEach((line, index) => {
    doc.text(line, 14, currentY + 10 + (index * 5));
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`${fileName.replace('.csv', '')}_report.pdf`);
};
