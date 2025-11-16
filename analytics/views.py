from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
import pandas as pd
import json
from .models import Dataset
from .utils import generate_pdf_report

@login_required
def dashboard(request):
    return render(request, 'analytics/dashboard.html')

@csrf_exempt
@login_required
def upload_dataset(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    file = request.FILES.get('file')
    if not file:
        return JsonResponse({'error': 'No file uploaded'}, status=400)
    
    try:
        df = pd.read_csv(file)
        data = df.to_dict('records')
        columns = list(df.columns)
        
        dataset = Dataset.objects.create(
            user=request.user,
            name=file.name,
            data=data,
            columns=columns,
            row_count=len(data)
        )
        
        return JsonResponse({
            'id': dataset.id,
            'name': dataset.name,
            'columns': columns,
            'row_count': len(data)
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
def get_dataset(request, dataset_id):
    try:
        dataset = Dataset.objects.get(id=dataset_id, user=request.user)
        return JsonResponse({
            'id': dataset.id,
            'name': dataset.name,
            'data': dataset.get_data(),
            'columns': dataset.get_columns(),
            'row_count': dataset.row_count
        })
    except Dataset.DoesNotExist:
        return JsonResponse({'error': 'Dataset not found'}, status=404)

@login_required
def generate_report(request, dataset_id):
    try:
        dataset = Dataset.objects.get(id=dataset_id, user=request.user)
        pdf_file = generate_pdf_report(dataset.get_data(), dataset.get_columns(), dataset.name)
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{dataset.name}_report.pdf"'
        response.write(pdf_file.getvalue())
        return response
    except Dataset.DoesNotExist:
        return JsonResponse({'error': 'Dataset not found'}, status=404)

@login_required
def get_statistics(request, dataset_id):
    try:
        dataset = Dataset.objects.get(id=dataset_id, user=request.user)
        df = pd.DataFrame(dataset.get_data())

        stats = {}
        for column in dataset.get_columns():
            column_data = df[column]
            if pd.api.types.is_numeric_dtype(column_data):
                # Calculate mode for numeric columns (handle multiple modes)
                mode_values = column_data.mode()
                mode = float(mode_values.iloc[0]) if not mode_values.empty else None
                mode_count = len(mode_values) if len(mode_values) > 1 else None

                stats[column] = {
                    'type': 'numeric',
                    'mean': float(column_data.mean()),
                    'median': float(column_data.median()),
                    'mode': mode,
                    'mode_count': mode_count,  # Number of modes if multiple
                    'min': float(column_data.min()),
                    'max': float(column_data.max()),
                    'missing': int(column_data.isna().sum())
                }
            else:
                value_counts = column_data.value_counts()
                # Calculate mode for categorical columns
                mode_values = column_data.mode()
                mode = str(mode_values.iloc[0]) if not mode_values.empty else None
                mode_count = len(mode_values) if len(mode_values) > 1 else None

                stats[column] = {
                    'type': 'categorical',
                    'unique': int(len(value_counts)),
                    'most_common': str(value_counts.index[0]) if not value_counts.empty else None,
                    'mode': mode,
                    'mode_count': mode_count,
                    'min': str(column_data.min()) if not column_data.empty else None,
                    'max': str(column_data.max()) if not column_data.empty else None,
                    'missing': int(column_data.isna().sum())
                }

        total_missing = int(df.isna().sum().sum())

        return JsonResponse({
            'column_stats': stats,
            'total_rows': int(len(df)),
            'total_columns': int(len(df.columns)),
            'total_missing': total_missing
        })
    except Dataset.DoesNotExist:
        return JsonResponse({'error': 'Dataset not found'}, status=404)
