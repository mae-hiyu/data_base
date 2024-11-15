# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('get_and_save_population_data/', views.get_and_save_population_data, name='get_and_save_population_data'),
    path('get_population_by_year/<int:year>/', views.get_population_by_year, name='get_population_by_year'),
]