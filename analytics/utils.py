import io
import math
import pandas as pd
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.widgets.markers import makeMarker

def create_bar_chart(data, x_column, y_column, width=500, height=300):
    df = pd.DataFrame(data)
    
    # Aggregate data
    grouped = df.groupby(x_column)[y_column].mean().nlargest(10)
    
    drawing = Drawing(width, height)
    bc = VerticalBarChart()
    bc.x = 50
    bc.y = 50
    bc.height = height - 100
    bc.width = width - 100
    bc.data = [grouped.values.tolist()]
    
    # Configure chart
    bc.strokeColor = colors.black
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = max(grouped.values) * 1.1
    bc.valueAxis.valueStep = bc.valueAxis.valueMax / 5
    bc.categoryAxis.labels.boxAnchor = 'ne'
    bc.categoryAxis.labels.angle = 30
    bc.categoryAxis.categoryNames = grouped.index.tolist()
    
    # Add color gradients to bars
    bc.bars[0].fillColor = colors.HexColor('#3B82F6')
    bc.bars[0].strokeColor = colors.HexColor('#1E40AF')
    
    drawing.add(bc)
    return drawing

def create_pie_chart(data, column, width=500, height=300):
    df = pd.DataFrame(data)
    value_counts = df[column].value_counts().nlargest(8)
    
    drawing = Drawing(width, height)
    pc = Pie()
    pc.x = width // 2
    pc.y = height // 2
    pc.width = min(width, height) - 100
    pc.height = pc.width
    pc.data = value_counts.values.tolist()
    pc.labels = value_counts.index.tolist()
    
    # Configure chart
    pc.strokeWidth = 0.5
    pc.slices.strokeWidth = 0.5
    
    # Add colors
    colors_list = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ]
    for i, color in enumerate(colors_list[:len(value_counts)]):
        pc.slices[i].fillColor = colors.HexColor(color)
        pc.slices[i].strokeColor = colors.white
    
    drawing.add(pc)
    return drawing

def create_trend_chart(data, x_column, y_column, width=500, height=300):
    df = pd.DataFrame(data)
    
    # Sort and aggregate data
    df = df.sort_values(x_column)
    grouped = df.groupby(x_column)[y_column].mean()
    
    drawing = Drawing(width, height)
    lc = HorizontalLineChart()
    lc.x = 50
    lc.y = 50
    lc.height = height - 100
    lc.width = width - 100
    lc.data = [grouped.values.tolist()]
    
    # Configure chart
    lc.lineLabels.fontSize = 8
    lc.strokeColor = colors.black
    lc.lines[0].strokeColor = colors.HexColor('#3B82F6')
    lc.lines[0].strokeWidth = 2
    lc.lines[0].symbol = makeMarker('FilledCircle')
    lc.valueAxis.valueMin = min(grouped.values) * 0.9
    lc.valueAxis.valueMax = max(grouped.values) * 1.1
    lc.valueAxis.valueStep = (lc.valueAxis.valueMax - lc.valueAxis.valueMin) / 5
    
    # Add labels
    lc.categoryAxis.categoryNames = [str(x)[:10] for x in grouped.index]
    lc.categoryAxis.labels.boxAnchor = 'ne'
    lc.categoryAxis.labels.angle = 30
    lc.categoryAxis.labels.fontSize = 8
    
    drawing.add(lc)
    return drawing

def generate_pdf_report(data, columns, filename):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#3B82F6')
    )
    elements.append(Paragraph('DataViz Pro - Analysis Report', title_style))
    
    # Dataset Info
    info_style = ParagraphStyle(
        'Info',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=20,
        textColor=colors.gray
    )
    elements.append(Paragraph(f'Dataset: {filename}', info_style))
    
    # Summary Statistics
    elements.append(Paragraph('Summary Statistics', styles['Heading2']))
    summary_data = [
        ['Metric', 'Value'],
        ['Total Rows', str(len(data))],
        ['Total Columns', str(len(columns))],
        ['Data Points', str(len(data) * len(columns))]
    ]
    
    summary_table = Table(summary_data)
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3B82F6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # Data Visualizations
    elements.append(Paragraph('Data Visualizations', styles['Heading2']))
    elements.append(Spacer(1, 10))
    
    # Find numeric and categorical columns
    df = pd.DataFrame(data)
    numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns
    categorical_cols = df.select_dtypes(include=['object']).columns
    
    if len(numeric_cols) > 0 and len(categorical_cols) > 0:
        # Bar Chart - Top categories by numeric value
        elements.append(Paragraph('Top Categories Distribution', styles['Heading3']))
        cat_col = categorical_cols[0]
        num_col = numeric_cols[0]
        bar_chart = create_bar_chart(data, cat_col, num_col)
        elements.append(bar_chart)
        elements.append(Spacer(1, 20))
        
        # Add chart description
        elements.append(Paragraph(
            f'Bar chart showing average {num_col} by {cat_col} (top 10 categories)',
            styles['Normal']
        ))
        elements.append(Spacer(1, 30))
    
    if len(categorical_cols) > 0:
        # Pie Chart - Category distribution
        elements.append(Paragraph('Category Distribution', styles['Heading3']))
        pie_chart = create_pie_chart(data, categorical_cols[0])
        elements.append(pie_chart)
        elements.append(Spacer(1, 20))
        
        elements.append(Paragraph(
            f'Distribution of records across {categorical_cols[0]} (top 8 categories)',
            styles['Normal']
        ))
        elements.append(Spacer(1, 30))
    
    if len(numeric_cols) > 1:
        # Trend Chart - Numeric relationship
        elements.append(Paragraph('Trend Analysis', styles['Heading3']))
        trend_chart = create_trend_chart(data, numeric_cols[0], numeric_cols[1])
        elements.append(trend_chart)
        elements.append(Spacer(1, 20))
        
        elements.append(Paragraph(
            f'Trend showing relationship between {numeric_cols[0]} and {numeric_cols[1]}',
            styles['Normal']
        ))
    
    elements.append(PageBreak())
    
    # Detailed Column Statistics
    elements.append(Paragraph('Detailed Column Statistics', styles['Heading2']))

    # Calculate statistics for each column
    df = pd.DataFrame(data)
    column_data = [['Column', 'Type', 'Mean', 'Median', 'Mode', 'Min', 'Max', 'Missing']]
    for col in columns:
        column_series = df[col]
        if pd.api.types.is_numeric_dtype(column_series):
            # Numeric statistics
            mean_val = float(column_series.mean()) if not column_series.empty else None
            median_val = float(column_series.median()) if not column_series.empty else None
            mode_vals = column_series.mode()
            mode_val = float(mode_vals.iloc[0]) if not mode_vals.empty else None
            min_val = float(column_series.min()) if not column_series.empty else None
            max_val = float(column_series.max()) if not column_series.empty else None
            missing = int(column_series.isna().sum())

            column_data.append([
                col, 'Numeric',
                f'{mean_val:.2f}' if mean_val is not None else '-',
                f'{median_val:.2f}' if median_val is not None else '-',
                f'{mode_val:.2f}' if mode_val is not None else '-',
                f'{min_val:.2f}' if min_val is not None else '-',
                f'{max_val:.2f}' if max_val is not None else '-',
                str(missing)
            ])
        else:
            # Categorical statistics
            mode_vals = column_series.mode()
            mode_val = str(mode_vals.iloc[0]) if not mode_vals.empty else None
            min_val = str(column_series.min()) if not column_series.empty else None
            max_val = str(column_series.max()) if not column_series.empty else None
            missing = int(column_series.isna().sum())
            unique_count = int(len(column_series.unique()))

            column_data.append([
                col, 'Categorical',
                '-', '-', mode_val or '-', min_val or '-', max_val or '-', str(missing)
            ])

    col_table = Table(column_data)
    col_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3B82F6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    elements.append(col_table)
    elements.append(Spacer(1, 20))

    # Correlation Heatmap
    elements.append(Paragraph('Correlation Heatmap', styles['Heading2']))
    elements.append(Spacer(1, 10))

    # Find numeric columns
    numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()

    if len(numeric_cols) >= 2:
        # Calculate correlation matrix
        corr_matrix = df[numeric_cols].corr()

        # Create heatmap data
        heatmap_data = []
        for i, col1 in enumerate(numeric_cols):
            row = []
            for j, col2 in enumerate(numeric_cols):
                corr_val = corr_matrix.loc[col1, col2]
                row.append(f'{corr_val:.2f}')
            heatmap_data.append(row)

        # Create table for heatmap
        heatmap_table_data = [[''] + numeric_cols]
        for i, col in enumerate(numeric_cols):
            heatmap_table_data.append([col] + heatmap_data[i])

        heatmap_table = Table(heatmap_table_data)
        heatmap_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3B82F6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('TOPPADDING', (0, 1), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ]))

        # Add color coding to correlation cells
        for i in range(1, len(heatmap_table_data)):
            for j in range(1, len(heatmap_table_data[i])):
                corr_val = float(heatmap_table_data[i][j])
                if corr_val > 0.7:
                    heatmap_table.setStyle(TableStyle([('BACKGROUND', (j, i), (j, i), colors.HexColor('#FECACA'))]))  # Light red
                elif corr_val > 0.3:
                    heatmap_table.setStyle(TableStyle([('BACKGROUND', (j, i), (j, i), colors.HexColor('#FED7AA'))]))  # Light orange
                elif corr_val > -0.3:
                    heatmap_table.setStyle(TableStyle([('BACKGROUND', (j, i), (j, i), colors.HexColor('#F3F4F6'))]))  # Light gray
                elif corr_val > -0.7:
                    heatmap_table.setStyle(TableStyle([('BACKGROUND', (j, i), (j, i), colors.HexColor('#BFDBFE'))]))  # Light blue
                else:
                    heatmap_table.setStyle(TableStyle([('BACKGROUND', (j, i), (j, i), colors.HexColor('#93C5FD'))]))  # Medium blue

        elements.append(heatmap_table)
        elements.append(Spacer(1, 10))

        # Heatmap legend
        legend_data = [
            ['Correlation Strength', 'Color'],
            ['Strong Positive (>0.7)', 'Red'],
            ['Moderate Positive (0.3-0.7)', 'Orange'],
            ['Weak (±0.3)', 'Gray'],
            ['Moderate Negative (-0.7 to -0.3)', 'Light Blue'],
            ['Strong Negative (<-0.7)', 'Blue']
        ]
        legend_table = Table(legend_data)
        legend_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3B82F6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('TOPPADDING', (0, 1), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ]))
        elements.append(legend_table)
    else:
        elements.append(Paragraph('Insufficient numeric columns for correlation analysis.', styles['Normal']))

    elements.append(Spacer(1, 20))

    # Dataset Analysis Section
    elements.append(Paragraph('Dataset Analysis', styles['Heading2']))

    analysis_points = []

    # Basic dataset info
    total_rows = len(data)
    total_cols = len(columns)
    total_cells = total_rows * total_cols
    missing_cells = sum(1 for row in data for col in columns if row[col] is None)
    missing_percentage = (missing_cells / total_cells) * 100 if total_cells > 0 else 0

    analysis_points.append(f"• Dataset contains {total_rows} rows and {total_cols} columns ({total_cells} total data points)")
    analysis_points.append(f"• Missing data: {missing_cells} cells ({missing_percentage:.1f}%)")

    # Column type analysis
    numeric_count = sum(1 for col in columns if pd.api.types.is_numeric_dtype(df[col]))
    categorical_count = total_cols - numeric_count
    analysis_points.append(f"• Column types: {numeric_count} numeric, {categorical_count} categorical")

    # Data quality insights
    if missing_percentage > 10:
        analysis_points.append("• WARNING: High missing data percentage - consider data cleaning")
    elif missing_percentage > 0:
        analysis_points.append("• Some missing values present - review data completeness")

    # Correlation insights
    if len(numeric_cols) >= 2:
        strong_correlations = []
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                corr = corr_matrix.iloc[i, j]
                if abs(corr) > 0.7:
                    direction = "positive" if corr > 0 else "negative"
                    strong_correlations.append(f"{numeric_cols[i]} and {numeric_cols[j]} ({corr:.2f})")

        if strong_correlations:
            analysis_points.append(f"• Strong correlations found: {', '.join(strong_correlations)}")
        else:
            analysis_points.append("• No strong correlations detected between numeric variables")

    # Distribution insights
    for col in columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            skewness = df[col].skew()
            if abs(skewness) > 1:
                direction = "right-skewed" if skewness > 0 else "left-skewed"
                analysis_points.append(f"• {col} shows {direction} distribution (skewness: {skewness:.2f})")

    # Recommendations
    analysis_points.append("• Recommendations:")
    if missing_percentage > 5:
        analysis_points.append("  - Consider imputation or removal of missing values")
    if len(numeric_cols) >= 2:
        analysis_points.append("  - Review correlation matrix for feature relationships")
    if total_rows > 1000:
        analysis_points.append("  - Large dataset: consider sampling for faster analysis")
    analysis_points.append("  - Generate additional visualizations for deeper insights")

    # Add analysis text
    for point in analysis_points:
        elements.append(Paragraph(point, styles['Normal']))
        elements.append(Spacer(1, 2))
    
    # Data Sample
    elements.append(Paragraph('Data Sample (First 10 Rows)', styles['Heading2']))
    sample_data = [[col for col in columns]]
    for row in data[:10]:
        sample_data.append([
            str(row[col])[:30] if row[col] is not None else '-'
            for col in columns
        ])
    
    sample_table = Table(sample_data)
    sample_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3B82F6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    elements.append(sample_table)
    
    # Build the PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer