const { generateReview } = require("../services/geminiService");

async function reviewController(req, res) {
  try {
    const { code, filename, language } = req.body || {};
    if (!code)
      return res.status(400).json({ error: 'Field "code" is required.' });

//     const prompt = `You are an expert code reviewer. Provide a clear, concise review of the following ${language || "code"} file${filename ? ` (${filename})` : ""}.

// Instructions: 1) Summarize the purpose, 2) list bugs/security/performance issues with line references or snippets, 3) give actionable fixes and recommended code snippets, 4) provide a short summary of severity.

// Code:\n\n${code}`;



  const prompt = `
You are a senior software engineer performing a professional code review.

IMPORTANT:
- Return ONLY valid JSON.
- Do NOT include markdown.
- Do NOT include explanations outside JSON.
- Do NOT add extra keys.
- Do NOT write long paragraphs.
- Keep everything concise and UI-friendly.

OUTPUT JSON FORMAT (FOLLOW EXACTLY):
{
  "purpose": [],
  "complexity": {
    "time": "",
    "space": ""
  },
  "issues": [
    { "issue": "", "fix": "" }
  ],
  "suggestions": [],
  "severity": "",
  "aiLikelihood": {
    "score": "",
    "reason": ""
  }
}

CONTENT RULES:
- purpose: 2–4 short bullet points (max 1 line each)
- complexity:
  - time: Big-O + very short reason
  - space: Big-O + very short reason
- issues: max 3 real issues only (no repetition)
- suggestions: max 3 practical improvements
- severity: one of ["Low", "Medium", "High"]
- aiLikelihood.score: value like "3/10", "6/10"
- aiLikelihood.reason: 1 short line explaining the score

STYLE RULES:
- Be direct and technical.
- No filler text.
- No generic statements.
- Focus on correctness, safety, and clarity.

CODE TO REVIEW:
${code}
`;


    const review = await generateReview(prompt);

    return res.json({ review });
  } catch (err) {
    console.error("reviewController error:", err);
    return res
      .status(500)
      .json({
        error: "Failed to generate review",
        details: err?.message || err,
      });
  }
}

module.exports = { reviewController };
