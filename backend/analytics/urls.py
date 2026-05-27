from django.urls import path
from . import views

urlpatterns = [
    path('track/', views.TrackEventView.as_view(), name='track_event'),
    path('dashboard-stats/', views.DashboardStatsView.as_view(), name='dashboard_stats'),
    path('funnel/', views.FunnelView.as_view(), name='funnel'),
    path('rfm/', views.RFMView.as_view(), name='rfm'),
    path('alerts/', views.AlertsView.as_view(), name='alerts'), 
]