from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('upload/', views.upload_dataset, name='upload_dataset'),
    path('dataset/<int:dataset_id>/', views.get_dataset, name='get_dataset'),
    path('dataset/<int:dataset_id>/report/', views.generate_report, name='generate_report'),
    path('dataset/<int:dataset_id>/statistics/', views.get_statistics, name='get_statistics'),
]