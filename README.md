# 🎬 AI Movie Insight Builder — Backend API

This repository contains the **backend service** for the AI Movie Insight Builder application.

The backend collects:

• Movie data from OMDb
• Audience reviews from IMDb
• AI-generated sentiment analysis

It exposes REST APIs used by the frontend application.

---

# 🌐 Live Backend

Backend API

https://ai-movie-insight-builder-backend-t2bh.onrender.com

Frontend

https://ai-movie-insight-builder-frontend.onrender.com

Frontend Repository

https://github.com/arifsaifi322/AI_Movie_Insight_Builder_frontend

Backend Repository

https://github.com/arifsaifi322/AI_Movie_Insight_Builder_-backend-

---

# ⚠️ Render Free Tier Notice

The backend is deployed on **Render free tier**.

Render automatically puts services into **sleep mode after inactivity**.

To wake the backend service first open:

https://ai-movie-insight-builder-backend-t2bh.onrender.com/movie/tt4154756

After the backend wakes up (will take almost 1-2 minutes), the frontend can connect normally. Both front end and backend will start in almost 2-3 minutes after urls been hit

---

# ⚙️ Setup Instructions

Clone repository

```bash
git clone https://github.com/arifsaifi322/AI_Movie_Insight_Builder_-backend-.git
cd AI_Movie_Insight_Builder_-backend-
```

Install dependencies

```bash
npm install
```

Create `.env`

```
OMDB_API_KEY=your_omdb_api_key
SCRAPE_TOKEN=your_scrape_token
API_KEY=your_ai_api_key
API_URL=your_ai_endpoint
```

Start server

```bash
node server.js
```

Server runs on

```
http://localhost:5000
```

---

# 🚀 API Endpoints

GET /test
Test server status

GET /health
Health check

GET /movie/:id
Returns movie details + reviews + sentiment

GET /reviews/:imdbId
Returns reviews + sentiment

POST /analyze-sentiment
Analyze custom review sentiment

GET /search?q=movie
Search movies via OMDb

---

# 🧠 AI Sentiment Analysis

IMDb reviews are combined and sent to an **OpenAI-compatible model**.

The AI generates:

• Audience sentiment summary
• Sentiment classification
• Explanation

Possible sentiment results:

POSITIVE
MIXED
NEGATIVE

---

# 🔎 Review Scraping

IMDb reviews are collected using:

• Scrape.do API
• Cheerio HTML parser

Up to **50 reviews** are extracted for analysis.

---

# ⚡ Caching

Movie responses are cached for:

```
1 hour
```

This improves performance and reduces scraping requests.

---

# 🧠 Tech Stack

Backend

• Node.js
• Express.js

Web Scraping

• Axios
• Cheerio

Data APIs

• OMDb API
• Scrape.do

AI

• OpenAI-compatible API

Deployment

• Render

---

# 🤔 Technology Choices & Rationale

### Why Node.js + Express

Node.js and Express were selected because they allow:

• Fast REST API development
• Easy integration with external APIs
• Efficient web scraping workflows

---

### Why Render for Deployment

The backend is deployed using **Render**.

I currently have **more experience deploying applications using Render** compared to platforms such as AWS.

Render provides:

• Simple deployment pipeline
• Automatic GitHub deployments
• Free tier hosting for testing projects

While I am continuing to learn **AWS and other cloud services**, Render allowed rapid deployment of the backend for this project.

---

# 📌 Assumptions

• IMDb page structure remains stable for scraping
• OMDb API remains available
• AI API returns responses in expected format
• Valid IMDb IDs are provided by users

---

# 🚀 Future Improvements

• Add Redis caching
• Add database storage for reviews
• Add rate limiting
• Improve scraping reliability
• Add analytics

---

# 👨‍💻 Author

Arif Saifi

BCA Student | Full Stack Developer | AI Enthusiast
