from django.urls import path
from . import views

urlpatterns = [
    path('track/', views.TrackEventView.as_view(), name='track_event'),
    path('dashboard-stats/', views.DashboardStatsView.as_view(), name='dashboard_stats'),
]