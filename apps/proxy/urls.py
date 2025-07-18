from django.urls import path
from . import views

urlpatterns = [
    # OpenAI兼容接口
    path('chat/completions', views.ChatCompletionView.as_view(), name='chat_completions'),
    path('models', views.ModelsListView.as_view(), name='models_list'),
    path('usage', views.UsageView.as_view(), name='usage'),
] 