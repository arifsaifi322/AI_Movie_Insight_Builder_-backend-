import express from "express";
import axios from "axios";
import cors from "cors";
import * as cheerio from "cheerio";
import "dotenv/config";
import AiResponse, { analyzeSentiment } from "./Airesponse .js";

const app = express();

app.use(cors());
app.use(express.json());

/* ========== CONFIG ========== */
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const SCRAPE_TOKEN = process.env.SCRAPE_TOKEN;

/* ========== CACHE ========== */
const cache = {};

/* ========== TEST ROUTE ========== */
app.get("/test", (req, res) => {
  res.json({ message: "Server working ✓" });
});

/* ========== SCRAPE IMDB REVIEWS ========== */
async function scrapeIMDbReviews(imdbId) {
  try {
    if (!SCRAPE_TOKEN) {
      throw new Error("SCRAPE_TOKEN not found in .env");
    }

    const targetUrl = `https://www.imdb.com/title/${imdbId}/reviews/`;

    const scrapeUrl =
      `https://api.scrape.do/?token=${SCRAPE_TOKEN}` +
      `&url=${encodeURIComponent(targetUrl)}` +
      `&render=true` +
      `&wait=5000` +
      `&geoCode=us`;

    console.log(`[1] Fetching reviews for ${imdbId}...`);
    const response = await axios.get(scrapeUrl, { timeout: 60000 });

    const html = response.data;
    console.log(`[2] Received ${html.length} bytes`);

    const $ = cheerio.load(html);
    const reviews = [];

    console.log(`[3] Parsing reviews...`);

    // Try different selectors
    const selectors = [
      "div[class*='user-review']",
      "div[class*='Review']",
      "article",
      "div[data-testid*='review']",
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      const count = elements.length;
      console.log(`    Selector "${selector}": ${count} elements`);

      if (count > 0) {
        elements.each((index, element) => {
          if (reviews.length >= 50) return false;

          try {
            const $el = $(element);
            const text = $el.text().trim();

            if (text.length > 100) {
              reviews.push({
                author: "User",
                text: text.substring(0, 500),
              });
              console.log(`    Found review ${reviews.length}`);
            }
          } catch (err) {
            // Silent
          }
        });

        if (reviews.length > 0) break;
      }
    }

    console.log(`[4] Extracted ${reviews.length} reviews\n`);

    // Fallback: generic divs
    if (reviews.length === 0) {
      const allDivs = $("div");
      console.log(`    Trying fallback: ${allDivs.length} total divs`);

      allDivs.each((index, element) => {
        if (reviews.length >= 50) return false;

        const text = $(element).text().trim();
        if (text.length > 200 && text.length < 2000) {
          reviews.push({
            author: "User",
            text: text.substring(0, 500),
          });
        }
      });
    }

    return reviews;
  } catch (error) {
    console.error("Scraping Error:", error.message);
    return [];
  }
}

/* ========== GET MOVIE + REVIEWS + SENTIMENT ========== */
app.get("/movie/:id", async (req, res) => {
  try {
    const movieId = req.params.id;
    const includeSentiment = req.query.sentiment !== "false"; // Default: true

    // Check cache
    if (cache[movieId]) {
      console.log(`✓ Returning cached data for ${movieId}`);
      return res.json(cache[movieId]);
    }

    console.log(`\n=== Fetching movie: ${movieId} ===`);

    // Get movie details from OMDB
    console.log("[1] Getting movie details from OMDB...");
    const movieResponse = await axios.get(
      `https://www.omdbapi.com/?i=${movieId}&apikey=${OMDB_API_KEY}`
    );

    const movieData = movieResponse.data;

    if (movieData.Response === "False") {
      return res.status(404).json({
        success: false,
        error: "Movie not found",
      });
    }

    console.log(`[2] Found: ${movieData.Title}`);

    // Get reviews from IMDb
    console.log("[3] Getting reviews from IMDb...");
    const reviews = await scrapeIMDbReviews(movieData.imdbID);

    // Analyze sentiment with AI
    let sentimentAnalysis = null;
    if (includeSentiment && reviews.length > 0) {
      console.log("[4] Analyzing sentiment with AI...");
      sentimentAnalysis = await analyzeSentiment(reviews);
    }

    const response = {
      success: true,
      movie: {
        id: movieData.imdbID,
        title: movieData.Title,
        year: movieData.Year,
        rated: movieData.Rated,
        runtime: movieData.Runtime,
        genre: movieData.Genre,
        director: movieData.Director,
        writer: movieData.Writer,
        actors: movieData.Actors,
        plot: movieData.Plot,
        language: movieData.Language,
        country: movieData.Country,
        awards: movieData.Awards,
        poster: movieData.Poster,
        imdbRating: movieData.imdbRating,
        imdbVotes: movieData.imdbVotes,
        type: movieData.Type,
      },
      reviews: {
        count: reviews.length,
        data: reviews,
      },
      ...(sentimentAnalysis && { sentiment: sentimentAnalysis }),
    };

    // Cache for 1 hour
    cache[movieId] = response;
    setTimeout(() => delete cache[movieId], 3600000);

    console.log(`✓ Complete data ready\n`);
    res.json(response);
  } catch (error) {
    console.error("Movie API Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch movie data",
      details: error.message,
    });
  }
});

/* ========== GET REVIEWS + SENTIMENT ONLY ========== */
app.get("/reviews/:imdbId", async (req, res) => {
  try {
    const imdbId = req.params.imdbId;
    const includeSentiment = req.query.sentiment !== "false";

    if (!imdbId.match(/^tt\d+$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid IMDb ID format (use tt0133093)",
      });
    }

    console.log(`\n=== Fetching reviews for ${imdbId} ===`);

    const reviews = await scrapeIMDbReviews(imdbId);

    let sentimentAnalysis = null;
    if (includeSentiment && reviews.length > 0) {
      console.log("Analyzing sentiment...");
      sentimentAnalysis = await analyzeSentiment(reviews);
    }

    res.json({
      success: true,
      imdbId,
      count: reviews.length,
      reviews,
      ...(sentimentAnalysis && { sentiment: sentimentAnalysis }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch reviews",
    });
  }
});

/* ========== ANALYZE SENTIMENT ONLY ========== */
app.post("/analyze-sentiment", async (req, res) => {
  try {
    const { reviews } = req.body;

    if (!reviews || !Array.isArray(reviews)) {
      return res.status(400).json({
        success: false,
        error: "Reviews array required in request body",
      });
    }

    console.log(`\n=== Analyzing sentiment for ${reviews.length} reviews ===`);
    const sentimentAnalysis = await analyzeSentiment(reviews);

    res.json(sentimentAnalysis);
  } catch (error) {
    console.error("Sentiment Analysis Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to analyze sentiment",
    });
  }
});

/* ========== SEARCH MOVIES ========== */
app.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query required (minimum 2 characters)",
      });
    }

    console.log(`\n=== Searching for: ${query} ===`);

    const response = await axios.get(
      `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`
    );

    if (response.data.Response === "False") {
      return res.status(404).json({
        success: false,
        error: "No movies found",
      });
    }

    const movies = response.data.Search.slice(0, 10).map((movie) => ({
      id: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      type: movie.Type,
      poster: movie.Poster,
    }));

    res.json({
      success: true,
      query,
      count: movies.length,
      results: movies,
    });
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Search failed",
    });
  }
});

/* ========== HEALTH CHECK ========== */
app.get("/health", (req, res) => {
  res.json({
    status: "✓ Server healthy",
    omdbApiKey: OMDB_API_KEY ? "✓ Configured" : "✗ Missing",
    scrapeToken: SCRAPE_TOKEN ? "✓ Configured" : "✗ Missing",
    aiApiKey: process.env.API_KEY ? "✓ Configured" : "✗ Missing",
  });
});

/* ========== SERVER ========== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════╗`);
  console.log(`║  Server running on port ${PORT}      ║`);
  console.log(`╚════════════════════════════════════╝\n`);
  console.log(`Endpoints:`);
  console.log(`  GET  /test                       - Test server`);
  console.log(`  GET  /health                     - Health check`);
  console.log(`  GET  /movie/:id                  - Get movie + 50 reviews + sentiment`);
  console.log(`  GET  /reviews/:imdbId            - Get reviews + sentiment`);
  console.log(`  POST /analyze-sentiment          - Analyze custom reviews`);
  console.log(`  GET  /search?q=inception         - Search movies\n`);
  console.log(`Query params:`);
  console.log(`  ?sentiment=false                 - Skip sentiment analysis\n`);
});