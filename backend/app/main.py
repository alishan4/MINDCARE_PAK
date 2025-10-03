from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import therapists, chat, favorites

app = FastAPI(title="MindCare AI", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for demo; lock down in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(therapists.router, prefix="/therapists", tags=["Therapists"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])

@app.get("/")
def root():
    return {"message": "Welcome to MindCare AI API (updated)"}
