from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
import yaml
import uvicorn

app = FastAPI(title="Token API 审计与管理系统")

# 加载OpenAPI规范
with open('openapi.yaml', 'r', encoding='utf-8') as f:
    openapi_spec = yaml.safe_load(f)

# 替换FastAPI的OpenAPI规范
app.openapi = lambda: openapi_spec

# 自定义Swagger UI
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Token API 审计与管理系统 - API文档"
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001) 