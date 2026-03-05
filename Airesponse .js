import "dotenv/config";

async function AiResponse(message) {
  const option = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    }),
  };

  try {
    let response = await fetch(process.env.API_URL, option);
    let jsonRes = await response.json();
    console.log("Response from OpenAI:", jsonRes);
    console.log("Message content : ", jsonRes.choices[0].message.content);
    return jsonRes.choices[0].message.content;
  } catch (error) {
    console.log(error);
  }
}

/* ========== SENTIMENT ANALYSIS ========== */
export async function analyzeSentiment(reviews) {
  try {
    if (!reviews || reviews.length === 0) {
      return {
        success: false,
        error: "No reviews provided",
      };
    }

    // Combine review texts
    const reviewTexts = reviews.map((r) => r.text).join("\n\n---\n\n");

    const prompt = `Analyze the sentiment of these IMDb reviews and provide:
1. A brief summary (2-3 sentences) of the audience sentiment
2. Overall sentiment classification: POSITIVE, MIXED, or NEGATIVE

Reviews:
${reviewTexts}

Response format (EXACTLY):
SUMMARY: [Your 2-3 sentence summary]
SENTIMENT: [POSITIVE/MIXED/NEGATIVE]
EXPLANATION: [1 sentence explaining why]`;

    console.log("[AI] Analyzing sentiment...");
    const analysis = await AiResponse(prompt);

    // Parse response
    const lines = analysis.split("\n");
    const summary = lines
      .find((l) => l.startsWith("SUMMARY:"))
      ?.replace("SUMMARY:", "")
      .trim() || "Unable to generate summary";

    const sentimentLine = lines.find((l) => l.startsWith("SENTIMENT:"));
    let sentiment = sentimentLine
      ?.replace("SENTIMENT:", "")
      .trim()
      .toUpperCase() || "MIXED";

    // Validate sentiment value
    if (!["POSITIVE", "MIXED", "NEGATIVE"].includes(sentiment)) {
      sentiment = "MIXED";
    }

    const explanation = lines
      .find((l) => l.startsWith("EXPLANATION:"))
      ?.replace("EXPLANATION:", "")
      .trim() || "";

    return {
      success: true,
      sentiment: {
        classification: sentiment,
        summary: summary,
        explanation: explanation,
        reviewsAnalyzed: reviews.length,
      },
    };
  } catch (error) {
    console.error("Sentiment Analysis Error:", error.message);
    return {
      success: false,
      error: "Failed to analyze sentiment",
      details: error.message,
    };
  }
}

export default AiResponse;