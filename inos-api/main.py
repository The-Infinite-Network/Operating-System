from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import intake, profile

app = FastAPI(title="INOS Backend API", version="1.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intake.router, prefix="/api/v1/intake", tags=["intake"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["profile"])

@app.get("/health")
def health_check():
    return {"status": "INOS Backend Online", "epoch": 0}

