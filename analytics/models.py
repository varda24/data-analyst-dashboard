from django.db import models
from django.contrib.auth.models import User
import json

class Dataset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    data = models.JSONField()
    columns = models.JSONField()
    row_count = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_data(self):
        return self.data if isinstance(self.data, list) else json.loads(self.data)

    def get_columns(self):
        return self.columns if isinstance(self.columns, list) else json.loads(self.columns)

    class Meta:
        db_table = 'datasets'
        ordering = ['-created_at']
